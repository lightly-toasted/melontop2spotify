let updating = false;

export function isUpdating() {
    return updating;
}

export function setUpdatingState(value: boolean) {
    updating = value;
}