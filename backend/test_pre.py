import pandas as pd
import json
from preprocessing import Preprocessor, PreprocessingError

preprocessor = Preprocessor.from_artifacts()
df = pd.read_csv('DataSet.csv')

for i, row in df.iterrows():
    payload = row.to_dict()
    import math
    for k, v in payload.items():
        if isinstance(v, float) and math.isnan(v):
            payload[k] = None
    try:
        preprocessor.transform_row(payload)
    except PreprocessingError as exc:
        print("--- 422 ERROR LOG (simulated) ---")
        print(f"Exception: {exc}")
        print(f"Row index: {i}")
        print(f"Row 'Unnamed: 0' or 'id': {payload.get('Unnamed: 0', payload.get('id', 'N/A'))}")
        payload_preview = dict(list(payload.items())[:20])
        print(f"Payload preview (first 20): {json.dumps(payload_preview)}")
        print("---------------------------------")
        break
