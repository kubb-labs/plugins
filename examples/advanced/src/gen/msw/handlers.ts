import { addFilesHandler } from './pet/addFilesHandler.ts'
import { addPetHandler } from './pet/addPetHandler.ts'
import { deletePetHandler } from './pet/deletePetHandler.ts'
import { findPetsByStatusHandler } from './pet/findPetsByStatusHandler.ts'
import { findPetsByTagsHandler } from './pet/findPetsByTagsHandler.ts'
import { getPetByIdHandler } from './pet/getPetByIdHandler.ts'
import { updatePetHandler } from './pet/updatePetHandler.ts'
import { updatePetWithFormHandler } from './pet/updatePetWithFormHandler.ts'
import { uploadFileHandler } from './pet/uploadFileHandler.ts'
import { createPetsHandler } from './pets/createPetsHandler.ts'
import { createUserHandler } from './user/createUserHandler.ts'
import { createUsersWithListInputHandler } from './user/createUsersWithListInputHandler.ts'
import { deleteUserHandler } from './user/deleteUserHandler.ts'
import { getUserByNameHandler } from './user/getUserByNameHandler.ts'
import { loginUserHandler } from './user/loginUserHandler.ts'
import { logoutUserHandler } from './user/logoutUserHandler.ts'
import { updateUserHandler } from './user/updateUserHandler.ts'

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
  createUserHandler(),
  createUsersWithListInputHandler(),
  loginUserHandler(),
  logoutUserHandler(),
  getUserByNameHandler(),
  updateUserHandler(),
  deleteUserHandler(),
] as const
