package com.medichain.service;

import com.medichain.dto.DashboardStatsResponse;
import com.medichain.dto.MedicineRequest;
import com.medichain.dto.MedicinesListResponse;
import com.medichain.dto.PaginationMeta;
import com.medichain.exception.ApiError;
import com.medichain.model.Medicine;
import com.medichain.model.User;
import com.medichain.repository.MedicineRepository;
import com.medichain.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public Medicine createMedicine(MedicineRequest request, String currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ApiError(HttpStatus.NOT_FOUND, "User not found"));

        Medicine medicine = new Medicine();
        copyProperties(request, medicine);
        medicine.setCreatedBy(user);
        medicine.updateStatus();

        return medicineRepository.save(medicine);
    }

    public MedicinesListResponse getMedicines(String search, String category, String expiry,
                                             String status, String sortBy, String order,
                                             Integer page, Integer limit) {
        Query query = new Query();

        if (search != null && !search.trim().isEmpty()) {
            Criteria searchCriteria = new Criteria().orOperator(
                    Criteria.where("medicineName").regex(search, "i"),
                    Criteria.where("genericName").regex(search, "i"),
                    Criteria.where("manufacturer").regex(search, "i")
            );
            query.addCriteria(searchCriteria);
        }

        if (category != null && !category.trim().isEmpty()) {
            query.addCriteria(Criteria.where("category").is(category));
        }

        if (status != null && !status.trim().isEmpty()) {
            query.addCriteria(Criteria.where("status").is(status));
        }

        if (expiry != null && !expiry.trim().isEmpty()) {
            Date now = new Date();
            if ("expired".equalsIgnoreCase(expiry)) {
                query.addCriteria(Criteria.where("expiryDate").lt(now));
            } else if ("expiringSoon".equalsIgnoreCase(expiry)) {
                Date thirtyDaysFromNow = new Date(now.getTime() + (30L * 24 * 60 * 60 * 1000));
                query.addCriteria(Criteria.where("expiryDate").gte(now).lte(thirtyDaysFromNow));
            } else if ("valid".equalsIgnoreCase(expiry)) {
                query.addCriteria(Criteria.where("expiryDate").gt(now));
            }
        }

        long total = mongoTemplate.count(query, Medicine.class);

        int pageNum = (page != null && page > 0) ? page : 1;
        int limitNum = (limit != null && limit > 0) ? Math.min(limit, 100) : 10;
        int skip = (pageNum - 1) * limitNum;

        query.skip(skip).limit(limitNum);

        String sortField = (sortBy != null && !sortBy.trim().isEmpty()) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(order) ? Sort.Direction.ASC : Sort.Direction.DESC;
        query.with(Sort.by(direction, sortField));

        List<Medicine> medicines = mongoTemplate.find(query, Medicine.class);

        int totalPages = (int) Math.ceil((double) total / limitNum);
        if (totalPages == 0) totalPages = 1;

        PaginationMeta meta = new PaginationMeta(total, pageNum, limitNum, totalPages);
        return new MedicinesListResponse(medicines, meta);
    }

    public Medicine getMedicineById(String id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ApiError(HttpStatus.NOT_FOUND, "Medicine not found"));
    }

    public Medicine updateMedicine(String id, MedicineRequest request) {
        Medicine medicine = getMedicineById(id);
        copyProperties(request, medicine);
        medicine.updateStatus();
        return medicineRepository.save(medicine);
    }

    public void deleteMedicine(String id) {
        Medicine medicine = getMedicineById(id);
        medicineRepository.delete(medicine);
    }

    public DashboardStatsResponse getDashboardStats() {
        Date now = new Date();
        long totalMedicines = medicineRepository.count();
        long lowStock = medicineRepository.countByStatus("Low Stock");
        long expired = medicineRepository.countByExpiryDateBefore(now);
        List<String> distinctCategories = mongoTemplate.findDistinct("category", Medicine.class, String.class);

        return new DashboardStatsResponse(
                totalMedicines,
                lowStock,
                expired,
                distinctCategories.size()
        );
    }

    private void copyProperties(MedicineRequest src, Medicine target) {
        target.setMedicineName(src.getMedicineName());
        target.setGenericName(src.getGenericName());
        target.setManufacturer(src.getManufacturer());
        target.setCategory(src.getCategory());
        target.setBatchNumber(src.getBatchNumber());
        target.setExpiryDate(src.getExpiryDate());
        target.setManufacturingDate(src.getManufacturingDate());
        target.setQuantity(src.getQuantity());
        target.setBuyingPrice(src.getBuyingPrice());
        target.setSellingPrice(src.getSellingPrice());
        target.setSupplier(src.getSupplier());
        target.setDescription(src.getDescription());
    }
}
