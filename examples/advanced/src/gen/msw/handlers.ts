import { addFilesHandler } from './pet/addFilesHandler'
import { addPetHandler } from './pet/addPetHandler'
import { deletePetHandler } from './pet/deletePetHandler'
import { findPetsByStatusHandler } from './pet/findPetsByStatusHandler'
import { findPetsByTagsHandler } from './pet/findPetsByTagsHandler'
import { getPetByIdHandler } from './pet/getPetByIdHandler'
import { updatePetHandler } from './pet/updatePetHandler'
import { updatePetWithFormHandler } from './pet/updatePetWithFormHandler'
import { uploadFileHandler } from './pet/uploadFileHandler'
import { createPetsHandler } from './pets/createPetsHandler'
import { streamPetEventsHandler } from './stream/streamPetEventsHandler'

export function createHandlers(options?: { baseURL?: string }) {
  return [
    createPetsHandler(undefined, options),
    updatePetHandler(undefined, options),
    addPetHandler(undefined, options),
    findPetsByStatusHandler(undefined, options),
    findPetsByTagsHandler(undefined, options),
    getPetByIdHandler(undefined, options),
    updatePetWithFormHandler(undefined, options),
    deletePetHandler(undefined, options),
    addFilesHandler(undefined, options),
    uploadFileHandler(undefined, options),
    streamPetEventsHandler(undefined, options),
  ] as const
}

export const handlers = createHandlers()
