
from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
def test():
    return "Server is up and running"
