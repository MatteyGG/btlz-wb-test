import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

//TODO: Пропустить через валидатор остальные перменные окружения

const envSchema = z.object({
    NODE_ENV: z.union([z.undefined(), z.enum(["development", "production"])]),
    POSTGRES_HOST: z.union([z.undefined(), z.string()]),
    POSTGRES_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
    POSTGRES_DB: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    APP_PORT: z.union([
        z.undefined(),
        z
            .string()
            .regex(/^[0-9]+$/)
            .transform((value) => parseInt(value)),
    ]),
    WB_API_TOKEN: z.string().nonempty(),
    GSHEET_SORT_KEY: z
    .string()
    .nonempty()
    .refine((val) => {
      const allowed = [
        "boxDeliveryCoefExpr",
        "boxDeliveryBase",
        "boxDeliveryLiter",
        "boxDeliveryMarketplaceCoefExpr",
        "boxDeliveryMarketplaceBase",
        "boxDeliveryMarketplaceLiter",
        "boxStorageCoefExpr",
        "boxStorageBase",
        "boxStorageLiter",
        "date",
        "warehouseName",
        "geoName"
      ] as const;
      return allowed.includes(val as any);
    }, {
      message: "GSHEET_SORT_KEY must be one of the allowed Warehouse keys"
    })
});

const env = envSchema.parse({
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
    APP_PORT: process.env.APP_PORT,
    WB_API_TOKEN: process.env.WB_API_TOKEN,
    GSHEET_SORT_KEY: process.env.GSHEET_SORT_KEY
});

export default env;
