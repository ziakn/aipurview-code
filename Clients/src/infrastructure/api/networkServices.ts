/**
 * @fileoverview This module provides a set of network services for making HTTP requests using CustomAxios.
 * It includes utility functions for logging requests and responses, as well as error handling.
 * The available HTTP methods are GET, POST, PATCH, and DELETE.
 *
 * @module networkServices
 */

import CustomAxios from "./customAxios";
import CustomException from "../exceptions/customeException";
import axios, { AxiosRequestConfig, AxiosResponseHeaders, ResponseType } from "axios";
import type { ApiErrorEnvelope, ApiResponse, RequestParams } from "./api.types";

/**
 * Normalize the loose `RequestParams` wrapper into an Axios request config,
 * narrowing the caller-supplied `responseType` string to Axios's union.
 */
const toRequestConfig = (config: RequestParams): AxiosRequestConfig => ({
  ...config,
  responseType: config.responseType as ResponseType | undefined,
});

// Utility function to handle errors
const handleError = (error: unknown): CustomException => {
  try {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as ApiErrorEnvelope | undefined;
      // Extract the most specific error message available
      let errorMessage = error.message; // fallback

      if (typeof responseData?.data === "string") {
        // Validation errors from STATUS_CODE[400] put the specific message in data.data
        errorMessage = responseData.data;
      } else if (responseData?.message) {
        // Standard error format with message
        errorMessage = responseData.message;
      } else if (responseData?.error) {
        // Alternative error format
        errorMessage = responseData.error;
      }

      return new CustomException(errorMessage, error.response?.status, error.response?.data);
    } else {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      return new CustomException(message, undefined, undefined);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error in handleError:", e);
    }
    throw e;
  }
};

// Logging function - only logs in development mode
const logRequest = (method: string, endpoint: string, params?: unknown, data?: unknown) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[API Request] ${method.toUpperCase()} ${endpoint}`, {
      params,
      data,
    });
  }
};

const logResponse = (
  method: string,
  endpoint: string,
  response: { status: number; data: { message?: string } },
) => {
  if (process.env.NODE_ENV === "development") {
    console.table(
      `[API Response] ${method.toUpperCase()} ${endpoint} ${response.data.message} (status ${response.status})`,
    );
  }
};

export const apiServices = {
  /**
   * Makes a GET request to the specified endpoint with optional query parameters.
   *
   * @template T - The type of the response data.
   * @param {string} endpoint - The API endpoint to send the request to.
   * @param {RequestParams} [params={}] - Optional query parameters to include in the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async get<T>(endpoint: string, params: RequestParams = {}): Promise<ApiResponse<T>> {
    // Extract special config options that should not be query params
    const { signal, responseType, ...queryParams } = params;

    logRequest("get", endpoint, queryParams);
    try {
      const response = await CustomAxios.get(endpoint, {
        params: queryParams,
        // Normalize the caller-supplied string to Axios's ResponseType union.
        responseType: (responseType ?? "json") as ResponseType,
        signal,
      });

      logResponse("get", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      const requestedAPIError = handleError(error);
      throw requestedAPIError;
    }
  },

  /**
   * Makes a POST request to the specified endpoint with optional data payload.
   *
   * @template T - The type of the response data.
   * @param {string} endpoint - The API endpoint to send the request to.
   * @param {unknown} [data={}] - Optional data payload to include in the request.
   * @param {RequestParams} [config={}] - Optional configuration for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async post<T>(
    endpoint: string,
    data: unknown = {},
    config: RequestParams = {},
  ): Promise<ApiResponse<T>> {
    logRequest("post", endpoint, undefined, data);
    try {
      const response = await CustomAxios.post(endpoint, data, toRequestConfig(config));
      logResponse("post", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as AxiosResponseHeaders,
      };
    } catch (error) {
      const requestedAPIError = handleError(error);
      throw requestedAPIError;
    }
  },

  /**
   * Makes a PATCH request to the specified endpoint with optional data payload.
   *
   * @template T - The type of the response data.
   * @param {string} endpoint - The API endpoint to send the request to.
   * @param {unknown} [data={}] - Optional data payload to include in the request.
   * @param {RequestParams} [config={}] - Optional configuration for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async patch<T>(
    endpoint: string,
    data: unknown = {},
    config: RequestParams = {},
  ): Promise<ApiResponse<T>> {
    logRequest("patch", endpoint, undefined, data);
    try {
      const response = await CustomAxios.patch(endpoint, data, toRequestConfig(config));
      logResponse("patch", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      const requestedAPIError = handleError(error);
      throw requestedAPIError;
    }
  },

  /**
   * Makes a PUT request to the specified endpoint with optional data payload.
   *
   * @template T - The type of the response data.
   * @param {string} endpoint - The API endpoint to send the request to.
   * @param {unknown} [data={}] - Optional data payload to include in the request.
   * @param {RequestParams} [config={}] - Optional configuration for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async put<T>(
    endpoint: string,
    data: unknown = {},
    config: RequestParams = {},
  ): Promise<ApiResponse<T>> {
    logRequest("put", endpoint, undefined, data);
    try {
      const response = await CustomAxios.put(endpoint, data, toRequestConfig(config));
      logResponse("put", endpoint, response);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      const requestedAPIError = handleError(error);
      throw requestedAPIError;
    }
  },

  /**
   * Makes a DELETE request to the specified endpoint.
   *
   * @template T - The type of the response data.
   * @param {string} endpoint - The API endpoint to send the request to.
   * @param {RequestParams} [config={}] - Optional configuration for the request.
   * @returns {Promise<ApiResponse<T>>} - A promise that resolves to the API response.
   */
  async delete<T>(endpoint: string, config: RequestParams = {}): Promise<ApiResponse<T>> {
    logRequest("delete", endpoint);
    try {
      const response = await CustomAxios.delete(endpoint, toRequestConfig(config));
      logResponse("delete", endpoint, response);
      return {
        data: response.data.data,
        status: response.status,
        statusText: response.data.message,
      };
    } catch (error) {
      const requestedAPIError = handleError(error);
      throw requestedAPIError;
    }
  },
};
