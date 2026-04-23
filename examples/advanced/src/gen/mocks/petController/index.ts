export { addFilesData, addFilesResponse, addFilesStatus200, addFilesStatus405 } from './addFiles.ts'
export { addPetData, addPetResponse, addPetStatus405, addPetStatusDefault } from './addPet.ts'
export { deletePetHeaderApiKey, deletePetPathPetId, deletePetResponse, deletePetStatus400 } from './deletePet.ts'
export { findPetsByStatusPathStepId, findPetsByStatusResponse, findPetsByStatusStatus200, findPetsByStatusStatus400 } from './findPetsByStatus.ts'
export {
  findPetsByTagsHeaderXEXAMPLE,
  findPetsByTagsQueryPage,
  findPetsByTagsQueryPageSize,
  findPetsByTagsQueryTags,
  findPetsByTagsResponse,
  findPetsByTagsStatus200,
  findPetsByTagsStatus400,
} from './findPetsByTags.ts'
export { getPetByIdPathPetId, getPetByIdResponse, getPetByIdStatus200, getPetByIdStatus400, getPetByIdStatus404 } from './getPetById.ts'
export {
  updatePetData,
  updatePetResponse,
  updatePetStatus200,
  updatePetStatus202,
  updatePetStatus400,
  updatePetStatus404,
  updatePetStatus405,
} from './updatePet.ts'
export {
  updatePetWithFormPathPetId,
  updatePetWithFormQueryName,
  updatePetWithFormQueryStatus,
  updatePetWithFormResponse,
  updatePetWithFormStatus405,
} from './updatePetWithForm.ts'
export { uploadFileData, uploadFilePathPetId, uploadFileQueryAdditionalMetadata, uploadFileResponse, uploadFileStatus200 } from './uploadFile.ts'
