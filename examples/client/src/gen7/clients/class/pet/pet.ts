/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type { AddPetRequestConfig, AddPetData, AddPetStatus200, AddPetStatus405 } from '../../../models/ts/pet/AddPet.ts'
import type { DeletePetRequestConfig, DeletePetResponse, DeletePetStatus400 } from '../../../models/ts/pet/DeletePet.ts'
import type { FindPetsByStatusRequestConfig, FindPetsByStatusStatus200, FindPetsByStatusStatus400 } from '../../../models/ts/pet/FindPetsByStatus.ts'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsStatus200, FindPetsByTagsStatus400 } from '../../../models/ts/pet/FindPetsByTags.ts'
import type { GetPetByIdRequestConfig, GetPetByIdStatus200, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../../models/ts/pet/GetPetById.ts'
import type {
  UpdatePetRequestConfig,
  UpdatePetData,
  UpdatePetStatus200,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/pet/UpdatePet.ts'
import type { UpdatePetWithFormRequestConfig, UpdatePetWithFormResponse, UpdatePetWithFormStatus405 } from '../../../models/ts/pet/UpdatePetWithForm.ts'
import type { UploadFileRequestConfig, UploadFileData, UploadFileStatus200 } from '../../../models/ts/pet/UploadFile.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'
import { buildFormData } from '../../../.kubb/config.ts'
import { mergeConfig } from '@kubb/plugin-client/clients/fetch'

export class pet {
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

  /**
   * @description Update an existing pet by Id
   * @summary Update an existing pet
   * {@link /pet}
   */
  async updatePet(
    { body }: Omit<UpdatePetRequestConfig, 'url'>,
    config: Partial<RequestConfig<UpdatePetData>> & {
      client?: Client
      contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
    } = {},
  ) {
    const { client: request = client, contentType = 'application/json', ...requestConfig } = mergeConfig(this.#config, config)
    const requestBody = body
    const res = await request<UpdatePetStatus200, ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>, UpdatePetData>({
      ...requestConfig,
      method: 'PUT',
      url: `/pet`,
      body: requestBody,
      contentType,
    })
    return res.data
  }

  /**
   * @description Add a new pet to the store
   * @summary Add a new pet to the store
   * {@link /pet}
   */
  async addPet(
    { body }: Omit<AddPetRequestConfig, 'url'>,
    config: Partial<RequestConfig<AddPetData>> & {
      client?: Client
      contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
    } = {},
  ) {
    const { client: request = client, contentType = 'application/json', ...requestConfig } = mergeConfig(this.#config, config)
    const requestBody = body
    const res = await request<AddPetStatus200, ResponseErrorConfig<AddPetStatus405>, AddPetData>({
      ...requestConfig,
      method: 'POST',
      url: `/pet`,
      body: requestBody,
      contentType,
    })
    return res.data
  }

  /**
   * @description Multiple status values can be provided with comma separated strings
   * @summary Finds Pets by status
   * {@link /pet/findByStatus}
   */
  async findPetsByStatus({ query }: Omit<FindPetsByStatusRequestConfig, 'url'> = {}, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = client, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<FindPetsByStatusStatus200, ResponseErrorConfig<FindPetsByStatusStatus400>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/pet/findByStatus`,
      query,
    })
    return res.data
  }

  /**
   * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
   * @summary Finds Pets by tags
   * {@link /pet/findByTags}
   */
  async findPetsByTags({ query }: Omit<FindPetsByTagsRequestConfig, 'url'> = {}, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = client, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<FindPetsByTagsStatus200, ResponseErrorConfig<FindPetsByTagsStatus400>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/pet/findByTags`,
      query,
    })
    return res.data
  }

  /**
   * @description Returns a single pet
   * @summary Find pet by ID
   * {@link /pet/:petId}
   */
  async getPetById({ path }: Omit<GetPetByIdRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = client, ...requestConfig } = mergeConfig(this.#config, config)
    const { petId } = path
    const res = await request<GetPetByIdStatus200, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, unknown>({
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
  async updatePetWithForm({ path, query }: Omit<UpdatePetWithFormRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = client, ...requestConfig } = mergeConfig(this.#config, config)
    const { petId } = path
    const res = await request<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, unknown>({
      ...requestConfig,
      method: 'POST',
      url: `/pet/${petId}`,
      query,
    })
    return res.data
  }

  /**
   * @description delete a pet
   * @summary Deletes a pet
   * {@link /pet/:petId}
   */
  async deletePet({ path, headers }: Omit<DeletePetRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = client, ...requestConfig } = mergeConfig(this.#config, config)
    const { petId } = path
    const mappedHeaders = headers ? { api_key: headers.apiKey } : undefined
    const res = await request<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, unknown>({
      ...requestConfig,
      method: 'DELETE',
      url: `/pet/${petId}`,
      headers: { ...mappedHeaders, ...requestConfig.headers },
    })
    return res.data
  }

  /**
   * @summary uploads an image
   * {@link /pet/:petId/uploadImage}
   */
  async uploadFile(
    { path, query, body }: Omit<UploadFileRequestConfig, 'url'>,
    config: Partial<RequestConfig<UploadFileData>> & { client?: Client; contentType?: 'application/json' | 'multipart/form-data' } = {},
  ) {
    const { client: request = client, contentType = 'application/json', ...requestConfig } = mergeConfig(this.#config, config)
    const { petId } = path
    const requestBody = body
    const formData = buildFormData(requestBody)
    const res = await request<UploadFileStatus200, ResponseErrorConfig<Error>, UploadFileData>({
      ...requestConfig,
      method: 'POST',
      url: `/pet/${petId}/uploadImage`,
      query,
      body: contentType === 'multipart/form-data' ? (formData as FormData) : requestBody,
      contentType,
    })
    return res.data
  }
}
