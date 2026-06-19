export const operations = {
  createPets: {
    path: '/pets/:uuid',
    method: 'post',
  },
  updatePet: {
    path: '/pet',
    method: 'put',
  },
  addPet: {
    path: '/pet',
    method: 'post',
  },
  findPetsByStatus: {
    path: '/pet/findByStatus/:step_id',
    method: 'get',
  },
  findPetsByTags: {
    path: '/pet/findByTags',
    method: 'get',
  },
  getPetById: {
    path: '/pet/:petId:search',
    method: 'get',
  },
  updatePetWithForm: {
    path: '/pet/:petId:search',
    method: 'post',
  },
  deletePet: {
    path: '/pet/:petId:search',
    method: 'delete',
  },
  addFiles: {
    path: '/pet/files',
    method: 'post',
  },
  uploadFile: {
    path: '/pet/:petId/uploadImage',
    method: 'post',
  },
}
