import { normalise_warehouse_data } from "#utils/normalize_warehouse.js";
import { formatDate } from "#utils/today_string.js";
import { GsheetsApiService } from "./api/gsheets-api.service.js";
import { WbApiService } from "./api/wb-api.service.js";
import { WarehouseStorageService } from "./storage/warehouse.database.service.js";

//Координирует сервисы
export class TariffsModule {
    private wbApiService: WbApiService;
    private warehouseStorage: WarehouseStorageService;
    private gsheetsApiService: GsheetsApiService;

    constructor() {
        this.wbApiService = new WbApiService();
        this.warehouseStorage = new WarehouseStorageService();
        this.gsheetsApiService = new GsheetsApiService();
    }
    async get_and_update_database(): Promise<{ success: boolean; message: string }> {
        // Формируем сегодняшний день
        const today = formatDate();
        // Забираем тарифы с api WB, для этого необходимо передать today, формат ГГГГ-ММ-ДД
        const rawApiResponse = await this.wbApiService.fetch_tariffs(today);
        // Нормализуем данные, приходят string
        const normalizedWarehouses = normalise_warehouse_data(rawApiResponse);
        // Сохраняем в storage, в базу данных
        await this.warehouseStorage.save_warehouses(await normalizedWarehouses);
        // Оповещаем на уровне info
        return { success: true, message: "Database updated" };
    }
    async get_and_update_gsheet(): Promise<{ success: boolean; message: string }> {
        // По условиям ТЗ, забираем из БД данные
        const freshData = await this.warehouseStorage.get_latest_warehouses();
        // Обновляем данные в google таблицах (Для мониторинга)
        await this.gsheetsApiService.update_gsheets_from_database(freshData);
        // Оповещаем на уровне info
        return { success: true, message: "Google sheets updated" };
    }
}
