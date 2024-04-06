export let updating = false;

export type UpdateResult = {
    success: boolean,
    message: string
}

export let updateResult: UpdateResult = {
    success: true,
    message: ''
};

export function setUpdatingState(state: boolean, result?: UpdateResult) {
    updating = state;
    if (result) updateResult = result
}