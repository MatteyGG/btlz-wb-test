import { Warehouse } from "#BoxTariffs/types/types.js";
import { response } from "express";

export interface ApiResponse {
    response: {
        data: {
            dtNextBox: string;
            dtTillMax: string;
            warehouseList: Warehouse[];
        }
    }
}

export async function fetchWB() {
    const response = await fetch("https://common-api.wildberries.ru/api/v1/tariffs/box?date=2025-10-23", {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${process.env.WB_API_TOKEN}`,
        },
    });

     const data = await response.json();

    return data;
}

