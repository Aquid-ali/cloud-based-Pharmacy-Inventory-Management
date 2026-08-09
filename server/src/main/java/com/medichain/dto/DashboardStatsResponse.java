package com.medichain.dto;

public class DashboardStatsResponse {

    private long totalMedicines;
    private long lowStock;
    private long expired;
    private long totalCategories;

    public DashboardStatsResponse() {}

    public DashboardStatsResponse(long totalMedicines, long lowStock, long expired, long totalCategories) {
        this.totalMedicines = totalMedicines;
        this.lowStock = lowStock;
        this.expired = expired;
        this.totalCategories = totalCategories;
    }

    public long getTotalMedicines() {
        return totalMedicines;
    }

    public void setTotalMedicines(long totalMedicines) {
        this.totalMedicines = totalMedicines;
    }

    public long getLowStock() {
        return lowStock;
    }

    public void setLowStock(long lowStock) {
        this.lowStock = lowStock;
    }

    public long getExpired() {
        return expired;
    }

    public void setExpired(long expired) {
        this.expired = expired;
    }

    public long getTotalCategories() {
        return totalCategories;
    }

    public void setTotalCategories(long totalCategories) {
        this.totalCategories = totalCategories;
    }
}
