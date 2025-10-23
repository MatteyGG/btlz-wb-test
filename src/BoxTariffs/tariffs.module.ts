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

  async syncAllData(): Promise<{ success: boolean; message: string }> {
    
    const rawApiResponse = await this.wbApiService.fetchTariffs(Date.now);
    
    const normalizedWarehouses = normalise_warehouse_data(rawApiResponse);
    
    await this.warehouseStorage.save_warehouses(await normalizedWarehouses);
    
    const freshData = await this.warehouseStorage.get_latest_warehouses();
    
    await this.gsheetsApiService.update_gsheets_from_database(freshData);
    
    return { success: true, message: 'Sync completed' };
  }
}