package com.medichain.repository;

import com.medichain.model.Medicine;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface MedicineRepository extends MongoRepository<Medicine, String> {
    long countByStatus(String status);
    long countByExpiryDateBefore(Date date);
}
