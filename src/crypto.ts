import * as uuid from "uuid";

export function randomUuid(): string {
    return uuid.v4();
}