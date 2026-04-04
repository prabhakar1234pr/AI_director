from datetime import datetime, timezone
from google.cloud import firestore

db = firestore.Client()


def create_project(uid: str, data: dict) -> str:
    ref = db.collection("projects").document()
    ref.set({
        **data,
        "userId": uid,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    })
    return ref.id


def update_project(project_id: str, uid: str, data: dict) -> None:
    ref = db.collection("projects").document(project_id)
    doc = ref.get()
    if not doc.exists:
        # Client-provided UUID — create the document with this specific ID
        ref.set({
            **data,
            "userId": uid,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        })
    elif doc.to_dict().get("userId") != uid:
        raise PermissionError("Project not found or access denied")
    else:
        ref.update({**data, "updatedAt": datetime.now(timezone.utc)})


def get_project(project_id: str, uid: str) -> dict | None:
    ref = db.collection("projects").document(project_id)
    doc = ref.get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    if data.get("userId") != uid:
        return None
    return {"id": doc.id, **data}


def list_user_projects(uid: str) -> list[dict]:
    query = (
        db.collection("projects")
        .where("userId", "==", uid)
        .order_by("updatedAt", direction=firestore.Query.DESCENDING)
        .limit(20)
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in query.stream()]
