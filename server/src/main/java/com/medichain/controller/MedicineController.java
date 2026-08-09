package com.medichain.controller;

import com.medichain.dto.ApiResponse;
import com.medichain.dto.DashboardStatsResponse;
import com.medichain.dto.MedicineRequest;
import com.medichain.dto.MedicinesListResponse;
import com.medichain.model.Medicine;
import com.medichain.service.MedicineService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    @Autowired
    private MedicineService medicineService;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createMedicine(
            @Valid @RequestBody MedicineRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Medicine medicine = medicineService.createMedicine(request, userDetails.getUsername());
        Map<String, Object> data = new HashMap<>();
        data.put("medicine", medicine);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Medicine created successfully", data));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<MedicinesListResponse>> getMedicines(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String expiry,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer limit) {

        MedicinesListResponse response = medicineService.getMedicines(
                search, category, expiry, status, sortBy, order, page, limit
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/stats/summary")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        DashboardStatsResponse stats = medicineService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMedicineById(@PathVariable String id) {
        Medicine medicine = medicineService.getMedicineById(id);
        Map<String, Object> data = new HashMap<>();
        data.put("medicine", medicine);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateMedicine(
            @PathVariable String id,
            @Valid @RequestBody MedicineRequest request) {

        Medicine medicine = medicineService.updateMedicine(id, request);
        Map<String, Object> data = new HashMap<>();
        data.put("medicine", medicine);

        return ResponseEntity.ok(ApiResponse.success("Medicine updated successfully", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteMedicine(@PathVariable String id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok(ApiResponse.success("Medicine deleted successfully"));
    }
}
