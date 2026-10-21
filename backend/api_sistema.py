from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class TarefaCriar(BaseModel):
    titulo: str
    descricao: str 

tarefas = {}
proximo_id = 1

@app.get("/")
def inicio():
    return {"mensagem": "Bem-vindo à API de Tarefas!"}

@app.get("/tarefas")
def listar_tarefas():
    return list(tarefas.values())

@app.get("/tarefas/{tarefa_id}")
def buscar_tarefa(tarefa_id: int):
    tarefa = tarefas.get(tarefa_id)

    if tarefa is None:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")

    return tarefa