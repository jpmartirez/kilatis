from enum import IntEnum

class Cls(IntEnum):
    AUTHENTIC = 0
    SPLICED = 1
    COPYMOVE = 2
    INPAINTED = 3
    AI_GENERATED = 4
    DEEPFAKE = 5

ID_TO_NAME = {c.value: c.name.lower() for c in Cls}
NAME_TO_ID = {v: k for k, v in ID_TO_NAME.items()}

def resolve_final_label(
    *,
    whole_image_synthetic: bool,
    face_manipulated: bool,
    edit_type: str | None = None,
) -> Cls:
    
    if face_manipulated:
        return Cls.DEEPFAKE
    if whole_image_synthetic:
        return Cls.AI_GENERATED
    if edit_type is not None:
        key = edit_type.strip().lower()
        if key in NAME_TO_ID:
            return Cls(NAME_TO_ID[key])
    return Cls.AUTHENTIC
