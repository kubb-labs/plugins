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

export const handlers = [
  createPetsHandler(),
  updatePetHandler(),
  addPetHandler(),
  findPetsByStatusHandler(),
  findPetsByTagsHandler(),
  getPetByIdHandler(),
  updatePetWithFormHandler(),
  deletePetHandler(),
  addFilesHandler(),
  uploadFileHandler(),
  streamPetEventsHandler(),
] as const
