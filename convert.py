# import os
# from pathlib import Path
# import keras
# import keras2onnx

# for path in os.scandir("./models/"):
#     if Path(path.path).is_dir():
#         continue
#     model: keras.models.Model = keras.saving.load_model(path.path) #type: ignore
#     onnx_model = keras2onnx.convert_keras(model, model.name)
#     onnx.save_model(onnx_model, os.path.join("models", "onnx", Path(path.path).stem + ".onnx"))
import tensorflow as tf
import tf2onnx
from pathlib import Path
import os

input_dir = Path("./models/")
output_dir = Path("./models/onnx/")
output_dir.mkdir(parents=True, exist_ok=True)

for path in input_dir.glob("*.keras"):
    print(f"Conversion de : {path.name}")

    # 1. Charger le modèle .keras
    model = tf.keras.models.load_model(path)

    # 2. Créer input_signature manuellement
    input_signature = [
        tf.TensorSpec(shape=inp.shape, dtype=inp.dtype, name=inp.name.split(":")[0])
        for inp in model.inputs
    ]

    # 3. Patch output_names pour éviter l'erreur
    #    On prend le nom de chaque tensor de sortie (sans le ":0")
    model.output_names = [out.name.split(":")[0] for out in model.outputs]

    # 4. Convertir en ONNX
    onnx_model, _ = tf2onnx.convert.from_keras(
        model,
        input_signature=input_signature,
        opset=13
    )

    # 5. Sauvegarder
    output_file = output_dir / (path.stem + ".onnx")
    with open(output_file, "wb") as f:
        f.write(onnx_model.SerializeToString())

    print(f"✅ Sauvegardé dans : {output_file}")
