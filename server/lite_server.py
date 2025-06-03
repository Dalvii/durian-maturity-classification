from pathlib import Path
import onnxruntime as ort
import numpy as np
import os
from typing import Literal
import librosa
import numpy as np
from quart import Quart, jsonify, request
from pydub import AudioSegment
from quart.datastructures import FileStorage

BASE_DIR = Path(__file__).resolve().parent
model_path = BASE_DIR / "server_models" / "model_v2_(0.51, 0.89)_.onnx"

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

async def exec_full_data_pipeline(file: str | FileStorage):
    global nb_tmp
    if (isinstance(file, str)):
        file_path = Path(file)
    else:
        file_path = BASE_DIR / "tmp" / f"tmp_{nb_tmp}.wav"
        (BASE_DIR / "tmp").mkdir(exist_ok=True)
        await file.save(file_path)
        
    y, sr = load_audio(str(file_path))
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

    file: FileStorage = files['audio']
    filename = file.filename

    supported_file_types = ["wav", "m4a", "mp4", "wave"]
    file_type: str = file.content_type.split("/")[1] # type: ignore
    if file_type not in supported_file_types:
        return jsonify({'error': f'File type is not supported are supported. \nSupported types : [{', '.join(supported_file_types)}]'}), 400
    
    if file_type in ["m4a", "mp4"]:
        tmp_dir = BASE_DIR / "tmp"
        tmp_dir.mkdir(exist_ok=True)
        file_path = (tmp_dir / f"tmp_m4a_to_wav_{nb_tmp}").with_suffix(f".{file_type}")
        await file.save(file_path)
        sound = AudioSegment.from_file(file_path, format=file_type)
        os.remove(file_path)
        sound.export(file_path.with_suffix(".wav"), format='wav')
        x = await exec_full_data_pipeline(str(file_path.with_suffix(".wav")))
    else:
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
    app.run(host='0.0.0.0', port=5000)



