import pandas as pd
from main import app, preprocess
from fastapi.testclient import TestClient

client = TestClient(app)
df = pd.read_csv('DataSet.csv')

for i, row in df.iterrows():
    payload = row.to_dict()
    # clean nan for json
    import math
    for k, v in payload.items():
        if isinstance(v, float) and math.isnan(v):
            payload[k] = None
    res = client.post('/predict', json=payload)
    if res.status_code == 422:
        print(f"Row {i} returned 422.")
        break
