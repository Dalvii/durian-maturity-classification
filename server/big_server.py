from argparse import Action
from ast import Tuple
from datetime import timezone
import datetime
from pathlib import Path
import typing
import keras
import numpy as np
import os
from typing import Literal, override
import librosa
import numpy as np
from quart import Quart, jsonify, make_response, request, send_file
from pydub import AudioSegment
from quart.datastructures import FileStorage
from tqdm import tqdm
from werkzeug.datastructures import MultiDict

BASE_DIR = Path(__file__).resolve().parent
print(f"Base directory: {BASE_DIR}")

def model_path(new=False) -> os.PathLike:
    dir_path = BASE_DIR / "server_models"
    # use the last version
    files = [(i.name, i.name.split("_v")[1].split('_')[0]) for i in os.scandir(dir_path)]
    # filter keras models
    files = [i for i in files if i[0].endswith(".keras")]
    sorted_files = sorted(files, key=lambda x : x[1])
    return dir_path / sorted_files[-1][0]

(train_submit_dir := Path(BASE_DIR) / "train_submitted").mkdir(exist_ok=True)
(tmp_dir := BASE_DIR / "tmp").mkdir(exist_ok=True)

def training_phase() -> int:
    return int(sorted(list(*os.scandir(train_submit_dir)))[-1].split("_")[-1])

# load model
model: keras.models.Sequential = keras.saving.load_model(model_path()) # type: ignore

# handle global server variables
nb_tmp = 0
max_t = 273 # value found in the data_preparation.py notebook

app = Quart(__name__)

class DateUtils:
    datetime_storage_pattern = "%Y-%m-%d_%H-%M-%S"
    datetime_response_pattern = "%Y-%m-%dT%H:%M:%SZ"

class LabelUtils:
    type LabelType = Literal["mature", "overripe"] 
    allowed_labels = ["mature", "overripe"] 
    @staticmethod
    def get_label(file_name: Path) -> tuple[LabelType, int]:
        return {
            "mature": ("mature", 0),
            "overripe": ("overripe", 1)
        }[file_name.stem.split("_")[-1]] # type: ignore
        
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
        await file.save(file_path)
        
    y, sr = load_audio(str(file_path))
    os.remove(file_path)
    nb_tmp+=1
    mfcc = compute_mfcc(y, sr)
    fixed = get_mfcc_fixed(mfcc)
    return redim(fixed)

async def save_conversion(file: FileStorage, out_dir: Path = tmp_dir, label: str = "") -> Path:
    global nb_tmp
    supported_file_types = ["wav", "m4a", "mp4", "wave", "x-m4a"]
    file_type: str = file.content_type.split("/")[1] # type: ignore
    if file_type not in supported_file_types:
        raise Exception(f'File type {file_type} is not supported are supported. \nSupported types : [{', '.join(supported_file_types)}]')

    now = datetime.datetime.now(datetime.UTC)
    file_path: Path = (out_dir / f"{now.strftime(DateUtils.datetime_storage_pattern)}_{label}").with_suffix(f".{file_type}")
    nb_tmp+=1
    out_path = file_path.with_suffix(".wav")
    if file_type not in ["wav", "wave"]:
        await file.save(file_path)
        sound = AudioSegment.from_file(file_path, format=file_type)
        os.remove(file_path)
        sound.export(out_path, format='wav')
    else:
        await file.save(out_path)
    return out_path

@app.route('/classify', methods=['POST'])
async def upload():
    files = await request.files
    if 'audio' not in files:
        return jsonify({'error': 'No files received'}), 400

    file: FileStorage = files['audio']
    try:
        converted = await save_conversion(file)
    except Exception as e:
        return jsonify({'error': e}), 400
    
    x = await exec_full_data_pipeline(str(converted))

    pred: np.ndarray = model.predict(x)[0] # type: ignore
    result = float(pred[0][0])

    durian_class: LabelUtils.LabelType | None = None
    
    durian_class = "mature" if (result > 0.5) else "overripe"    

    confidence = max(result, 1-result)

    resp = {
        'type': durian_class,
        'confidence': confidence
    }
    return resp, 200

@app.post('/add-training-data')
async def add_training_data():
    form: MultiDict[typing.Any, typing.Any] = await request.form
    files = await request.files
    name, content = [*files.items()][0]
    if name != "audio" or not isinstance(content, FileStorage):
        return jsonify({'error': 'No files received'}), 400
    label: str = form.get("label") #type: ignore
    
    if label not in LabelUtils.allowed_labels:
        return {"error": f"label must be in : [{", ".join(LabelUtils.allowed_labels)}]"}, 400
        
    converted: Path = await save_conversion(content, out_dir = BASE_DIR / "train_submitted" / f"phase_{training_phase}", label=label)
    return {"message": "file successfully created"}, 200

@app.get('/submitted-training-data')
async def get_submitted_data():
    mature_files = train_submit_dir.glob("*_mature.wav")
    overripe_files = train_submit_dir.glob("*_overripe.wav")
    
    def process_file(path: Path):
        infos = path.stem.split("_")
        dt = '_'.join(infos[:-1])
        dt = datetime.datetime.strptime(dt, DateUtils.datetime_storage_pattern).replace(tzinfo=timezone.utc)
        label = infos[-1]
        return {
            "name": path.name,
            "date": dt.strftime(DateUtils.datetime_response_pattern),
            "label": label,
            "size": path.stat().st_size,
            "link": str(path.relative_to(BASE_DIR))
        }
    return [process_file(file) for file in [*mature_files, *overripe_files]], 200

@app.get("/get-audio")
async def get_file():
    file_path: str | None = request.args.get("url")
    if file_path is None:
        return {"error": f"Missing query parameter \"url\""}, 400
    full_path = BASE_DIR / Path(file_path)
    if not full_path.resolve().is_relative_to(train_submit_dir.resolve()):
        return {"error": f"Resource access not allowed for \"{file_path}\""}, 400
    return await send_file(full_path)


@app.put("/train-phase/")
async def train():
    nb_epochs: int = int(request.args.get("epochs", 10))
    if nb_epochs <= 0:
        return {"error": "epochs must be a positive integer"}, 400
    
    async def send_events():
        import asyncio
        import json
        import threading
        
        queue = asyncio.Queue()
        training_complete = asyncio.Event()
        
        class EpochCallback(keras.callbacks.Callback):
            def on_epoch_begin(self, epoch, logs=None):
                asyncio.run_coroutine_threadsafe(
                    queue.put({
                        "phase": "training",
                        "progressPercentage": (epoch / nb_epochs) * 100,
                        "message": f"Training epoch {epoch + 1}"
                    }),
                    asyncio.get_event_loop()
                )
            
            def on_train_end(self, logs=None):
                async def set_event():
                    training_complete.set()
                asyncio.run_coroutine_threadsafe(
                    set_event(),
                    asyncio.get_event_loop()
                )
        
        # Prépare les données
        x = []
        y = []
        for entry in tqdm(os.scandir(train_submit_dir / f"phase_{training_phase()}")):
            x.append(await exec_full_data_pipeline(str(Path(entry.path).absolute())))
            y.append(1 if "mature" in entry.name else 0)
        
        # Démarre l'entraînement dans un thread séparé
        def train_model():
            callback = EpochCallback()
            model.fit(x, y, callbacks=[callback], epochs=nb_epochs, verbose="auto")
            # Crée un nouveau dossier pour la phase suivante
            (train_submit_dir / f"phase_{training_phase() + 1}").mkdir(exist_ok=True)
        
        # Démarre le thread d'entraînement
        threading.Thread(target=train_model).start()
        
        # Envoie les événements au fur et à mesure qu'ils arrivent
        while not training_complete.is_set() or not queue.empty():
            try:
                event = await asyncio.wait_for(queue.get(), timeout=1.0)
                yield f"data: {json.dumps(event)}\n\n"
            except asyncio.TimeoutError:
                # Continue d'attendre si aucun événement n'est disponible mais l'entraînement n'est pas terminé
                continue
        
        # save model
        model.save(model_path(new=True))


        
        # Envoie un événement final
        yield f"data: {json.dumps({'phase': 'complete', 'message': 'Training complete'})}\n\n"

    return await make_response(
        send_events(),
        {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked',
        },
    )
@app.get("/")
async def home():
    return await send_file(BASE_DIR / "front/index.html")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)



