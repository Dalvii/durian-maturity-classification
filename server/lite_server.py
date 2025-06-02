import sys
import onnxruntime as ort
import numpy as np
import os
from typing import Literal
import librosa
import numpy as np
from quart import Quart, jsonify, request

# Handle docker/local path flexibility 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
model_path = os.path.join(BASE_DIR, "server_models", "model_v2_(0.51, 0.89)_.onnx")

# load onnx model
session = ort.InferenceSession(model_path)
input_name = session.get_inputs()[0].name

# handle global server variables
nb_tmp = 0
max_t = 273 # value found in the data_preparation.py notebook

app = Quart(__name__)

def load_audio(path: str):
    y, sr = librosa.load(path, sr=None)
    return y, sr

def compute_mfcc(y, sr):
    n_mfcc     = 40        # number of coefficients
    n_fft      = 2048      # window size STFT
    hop_length = 512
    mfcc_features = librosa.feature.mfcc(
        y=y, sr=sr, 
        n_mfcc=n_mfcc, 
        n_fft=n_fft, 
        hop_length=hop_length
        )
    return librosa.util.normalize(mfcc_features, axis=1)

def get_mfcc_fixed(m: np.ndarray):
    T_i = m.shape[1]
    if T_i < max_t:
        pad_width = max_t - T_i
        m2 = np.pad(m,
                    pad_width=((0,0),
                    (0,pad_width)), 
                    mode='constant',
                    constant_values=0)
    else:
        m2 = m[:, :max_t]
    return m2

def redim(mfcc_fixed):
    result =  np.stack([mfcc_fixed], axis=0)
    result = result[..., np.newaxis]
    return result

async def exec_full_data_pipeline(file):
    global nb_tmp
    file_name = f"tmp_{nb_tmp}"
    file_path = os.path.join("server", "tmp", file_name)
    os.makedirs("server/tmp", exist_ok=True)
    await file.save(file_path)
    y, sr = load_audio(file_path)
    os.remove(file_path)
    nb_tmp+=1
    mfcc = compute_mfcc(y, sr)
    fixed = get_mfcc_fixed(mfcc)
    return redim(fixed)

@app.route('/classify', methods=['POST'])
async def upload():
    files = await request.files
    if 'audio' not in files:
        return jsonify({'error': 'No files received'}), 400

    file = files['audio']
    filename = file.filename

    if not filename.endswith('.wav'):
        return jsonify({'error': 'Only wav files are supported'}), 400
    
    print(file)
    x = await exec_full_data_pipeline(file)
    pred: np.ndarray = session.run(None, {input_name: x.astype(np.float32)})[0] # type: ignore
    result = float(pred[0][0])

    durian_class: Literal["mature", "immature", "overripe"] | None = None
    
    durian_class = "mature" if (result > 0.5) else "overripe"    

    confidence = max(result, 1-result)

    resp = {
        'type': durian_class,
        'confidence:': confidence
    }
    print(resp)
    return jsonify(resp), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0')



