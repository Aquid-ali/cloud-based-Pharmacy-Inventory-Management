package com.medichain.dto;

import com.medichain.model.Medicine;
import java.util.List;

public class MedicinesListResponse {

    private List<Medicine> medicines;
    private PaginationMeta pagination;

    public MedicinesListResponse() {}

    public MedicinesListResponse(List<Medicine> medicines, PaginationMeta pagination) {
        this.medicines = medicines;
        this.pagination = pagination;
    }

    public List<Medicine> getMedicines() {
        return medicines;
    }

    public void setMedicines(List<Medicine> medicines) {
        this.medicines = medicines;
    }

    public PaginationMeta getPagination() {
        return pagination;
    }

    public void setPagination(PaginationMeta pagination) {
        this.pagination = pagination;
    }
}
