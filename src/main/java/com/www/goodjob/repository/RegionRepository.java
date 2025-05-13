package com.www.goodjob.repository;

import com.www.goodjob.domain.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegionRepository extends JpaRepository<Region, Long> {

    @Query("SELECT r FROM Region r")
    List<Region> findAllRegions();
}
