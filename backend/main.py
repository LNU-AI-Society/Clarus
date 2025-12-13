from fastapi import FastAPI
from typing import Union 

app = FastAPI()

@app.get("/")
def test():
    return "Hello World"
