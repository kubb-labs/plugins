/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { AddPetData, AddPetResponse, AddPetStatus405 } from '../../../models/ts/petController/AddPet.ts'
import type { DeletePetResponse, DeletePetPathPetId, DeletePetHeaderApiKey, DeletePetStatus400 } from '../../../models/ts/petController/DeletePet.ts'
import type { FindPetsByStatusResponse, FindPetsByStatusQueryStatus, FindPetsByStatusStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import type {
  FindPetsByTagsResponse,
  FindPetsByTagsQueryTags,
  FindPetsByTagsQueryPage,
  FindPetsByTagsQueryPageSize,
  FindPetsByTagsStatus400,
} from '../../../models/ts/petController/FindPetsByTags.ts'
import type { GetPetByIdResponse, GetPetByIdPathPetId, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../../models/ts/petController/GetPetById.ts'
import type {
  UpdatePetData,
  UpdatePetResponse,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/petController/UpdatePet.ts'
import type {
  UpdatePetWithFormResponse,
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormQueryName,
  UpdatePetWithFormQueryStatus,
  UpdatePetWithFormStatus405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import type { UploadFileData, UploadFileResponse, UploadFilePathPetId, UploadFileQueryAdditionalMetadata } from '../../../models/ts/petController/UploadFile.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'
import { buildFormData } from '../../../.kubb/config.ts'
import { mergeConfig } from '@kubb/plugin-client/clients/fetch'

export class petController {
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

  /**
   * @description Update an existing pet by Id
   * @summary Update an existing pet
   * {@link /pet}
   */
  async updatePet(data: UpdatePetData, config: Partial<RequestConfig<UpdatePetData>> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = data
    const res = await request<UpdatePetResponse, ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>, UpdatePetData>({
      ...requestConfig,
      method: 'PUT',
      url: `/pet`,
      data: requestData,
    })
    return res.data
  }

  /**
   * @description Add a new pet to the store
   * @summary Add a new pet to the store
   * {@link /pet}
   */
  async addPet(data: AddPetData, config: Partial<RequestConfig<AddPetData>> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = data
    const res = await request<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetData>({
      ...requestConfig,
      method: 'POST',
      url: `/pet`,
      data: requestData,
    })
    return res.data
  }

  /**
   * @description Multiple status values can be provided with comma separated strings
   * @summary Finds Pets by status
   * {@link /pet/findByStatus}
   */
  async findPetsByStatus(params?: { status?: FindPetsByStatusQueryStatus }, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<FindPetsByStatusResponse, ResponseErrorConfig<FindPetsByStatusStatus400>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/pet/findByStatus`,
      params,
    })
    return res.data
  }

  /**
   * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
   * @summary Finds Pets by tags
   * {@link /pet/findByTags}
   */
  async findPetsByTags(
    params?: { tags?: FindPetsByTagsQueryTags; page?: FindPetsByTagsQueryPage; pageSize?: FindPetsByTagsQueryPageSize },
    config: Partial<RequestConfig> & { client?: Client } = {},
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<FindPetsByTagsResponse, ResponseErrorConfig<FindPetsByTagsStatus400>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/pet/findByTags`,
      params,
    })
    return res.data
  }

  /**
   * @description Returns a single pet
   * @summary Find pet by ID
   * {@link /pet/:petId}
   */
  async getPetById({ petId }: { petId: GetPetByIdPathPetId }, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetPetByIdResponse, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/pet/${petId}`,
    })
    return res.data
  }

  /**
   * @summary Updates a pet in the store with form data
   * {@link /pet/:petId}
   */
  async updatePetWithForm(
    { petId }: { petId: UpdatePetWithFormPathPetId },
    params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus },
    config: Partial<RequestConfig> & { client?: Client } = {},
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, unknown>({
      ...requestConfig,
      method: 'POST',
      url: `/pet/${petId}`,
      params,
    })
    return res.data
  }

  /**
   * @description delete a pet
   * @summary Deletes a pet
   * {@link /pet/:petId}
   */
  async deletePet(
    { petId }: { petId: DeletePetPathPetId },
    headers?: { api_key?: DeletePetHeaderApiKey },
    config: Partial<RequestConfig> & { client?: Client } = {},
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, unknown>({
      ...requestConfig,
      method: 'DELETE',
      url: `/pet/${petId}`,
      headers: { ...headers, ...requestConfig.headers },
    })
    return res.data
  }

  /**
   * @summary uploads an image
   * {@link /pet/:petId/uploadImage}
   */
  async uploadFile(
    { petId }: { petId: UploadFilePathPetId },
    data: UploadFileData,
    params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata },
    config: Partial<RequestConfig<UploadFileData>> & { client?: Client } = {},
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = data
    const formData = buildFormData(requestData)
    const res = await request<UploadFileResponse, ResponseErrorConfig<Error>, UploadFileData>({
      ...requestConfig,
      method: 'POST',
      url: `/pet/${petId}/uploadImage`,
      params,
      data: formData as FormData,
    })
    return res.data
  }
}
