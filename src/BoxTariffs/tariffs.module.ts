import { normalise_warehouse_data } from "#utils/normalize_warehouse.js";
import { GsheetsApiService } from "./api/gsheets-api.service.js";
import { WbApiService } from "./api/wb-api.service.js";
import { WarehouseStorageService } from "./storage/warehouse.database.service.js";

//Координирует процессы
export class TariffsModule {
  private wbApiService: WbApiService;
  private warehouseStorage: WarehouseStorageService;
  private gsheetsApiService: GsheetsApiService;

  constructor() {
    this.wbApiService = new WbApiService();
    this.warehouseStorage = new WarehouseStorageService();
    this.gsheetsApiService = new GsheetsApiService();
  }

  async get_and_update_tariffs(): Promise<{ success: boolean; message: string }> {
    
    // Забираем тарифы с api WB
    const rawApiResponse = await this.wbApiService.fetchTariffs(Date.now);
    // Нормализуем данные, приходят string
    const normalizedWarehouses = normalise_warehouse_data(rawApiResponse);
    // Сохраняем в storage, в базу данных
    await this.warehouseStorage.save_warehouses(await normalizedWarehouses);
    // По условиям ТЗ, забираем из БД данные
    const freshData = await this.warehouseStorage.get_latest_warehouses();
    // Обновляем данные в google таблицах (Для мониторинга)
    await this.gsheetsApiService.update_gsheets_from_database(freshData);
    // Оповещаем на уровне info
    return { success: true, message: 'Sync completed' };
  }
}