/* eslint-disable no-alert, no-console */

export const operations = {
  updatePet: {
    path: '/pet',
    method: 'put',
  },
  addPet: {
    path: '/pet',
    method: 'post',
  },
  findPetsByStatus: {
    path: '/pet/findByStatus',
    method: 'get',
  },
  findPetsByTags: {
    path: '/pet/findByTags',
    method: 'get',
  },
  getPetById: {
    path: '/pet/:petId',
    method: 'get',
  },
  updatePetWithForm: {
    path: '/pet/:petId',
    method: 'post',
  },
  deletePet: {
    path: '/pet/:petId',
    method: 'delete',
  },
  uploadFile: {
    path: '/pet/:petId/uploadImage',
    method: 'post',
  },
}
