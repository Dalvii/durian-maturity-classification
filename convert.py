import tf2onnx
from pathlib import Path
import keras
import tensorflow as tf

input_dir = Path("./models/")
output_dir = Path("./server/server_models/")
output_dir.mkdir(parents=True, exist_ok=True)

for path in input_dir.glob("*.keras"):
    print(f"Conversion de : {path.name}")

    # Load model
    model: keras.models.Model = keras.models.load_model(path) # type: ignore

    # Extract layer signature 
    input_signature = [
        tf.TensorSpec(shape=inp.shape, dtype=inp.dtype, name=inp.name.split(":")[0]) # type: ignore
        for inp in model.inputs
    ]

    model.output_names = [out.name.split(":")[0] for out in model.outputs]

    # Convert to ONNX
    onnx_model, _ = tf2onnx.convert.from_keras(
        model,
        input_signature=input_signature,
        opset=13
    )

    # Save
    output_file = output_dir / (path.stem + ".onnx")
    with open(output_file, "wb") as f:
        f.write(onnx_model.SerializeToString())

    print(f"✅ Sauvegardé dans : {output_file}")
