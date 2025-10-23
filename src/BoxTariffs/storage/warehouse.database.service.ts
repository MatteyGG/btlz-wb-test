import { ApiResponse } from "#BoxTariffs/api/wb-api.service.js";

export async function saveToDb(response: ApiResponse) {
    console.log(response.response.data.warehouseList)
    
}