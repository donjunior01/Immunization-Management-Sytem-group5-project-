package com.immunizationdb.config;

import com.immunizationdb.auth.entity.Role;
import com.immunizationdb.auth.entity.User;
import com.immunizationdb.auth.repository.UserRepository;
import com.immunizationdb.campaign.entity.Campaign;
import com.immunizationdb.campaign.repository.CampaignRepository;
import com.immunizationdb.inventory.entity.VaccineBatch;
import com.immunizationdb.inventory.repository.VaccineBatchRepository;
import com.immunizationdb.patient.entity.Patient;
import com.immunizationdb.patient.repository.PatientRepository;
import com.immunizationdb.vaccination.entity.Vaccination;
import com.immunizationdb.vaccination.repository.VaccinationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder {

    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    @Bean
    public CommandLineRunner seedDatabase(
            UserRepository userRepository,
            PatientRepository patientRepository,
            VaccineBatchRepository vaccineBatchRepository,
            VaccinationRepository vaccinationRepository,
            CampaignRepository campaignRepository) {
        
        return args -> {
            // Check if data already exists
            if (userRepository.count() > 3) {
                log.info("Database already seeded. Skipping seed operation.");
                return;
            }

            log.info("Starting database seeding...");

            // Seed additional users (3 default users already exist in migration)
            seedAdditionalUsers(userRepository);

            // Seed patients
            List<Patient> patients = seedPatients(patientRepository);
            log.info("Seeded {} patients", patients.size());

            // Seed vaccine batches
            List<VaccineBatch> batches = seedVaccineBatches(vaccineBatchRepository);
            log.info("Seeded {} vaccine batches", batches.size());

            // Seed vaccinations
            List<Vaccination> vaccinations = seedVaccinations(vaccinationRepository, patients, batches);
            log.info("Seeded {} vaccinations", vaccinations.size());

            // Seed campaigns
            List<Campaign> campaigns = seedCampaigns(campaignRepository);
            log.info("Seeded {} campaigns", campaigns.size());

            log.info("Database seeding completed successfully!");
        };
    }

    private void seedAdditionalUsers(UserRepository userRepository) {
        List<User> additionalUsers = new ArrayList<>();
        
        // Additional health workers
        for (int i = 1; i <= 5; i++) {
            additionalUsers.add(User.builder()
                    .username("health.worker" + i)
                    .password(passwordEncoder.encode("Password123!"))
                    .email("health.worker" + i + "@immunization.com")
                    .fullName("Health Worker " + i)
                    .role(Role.HEALTH_WORKER)
                    .facilityId("FAC00" + ((i % 3) + 1))
                    .active(true)
                    .locked(false)
                    .failedLoginAttempts(0)
                    .createdAt(LocalDateTime.now())
                    .deleted(false)
                    .build());
        }

        // Additional facility managers
        for (int i = 1; i <= 3; i++) {
            additionalUsers.add(User.builder()
                    .username("facility.manager" + i)
                    .password(passwordEncoder.encode("Password123!"))
                    .email("facility.manager" + i + "@immunization.com")
                    .fullName("Facility Manager " + i)
                    .role(Role.FACILITY_MANAGER)
                    .facilityId("FAC00" + i)
                    .districtId("DIST00" + i)
                    .active(true)
                    .locked(false)
                    .failedLoginAttempts(0)
                    .createdAt(LocalDateTime.now())
                    .deleted(false)
                    .build());
        }

        // Additional government officials
        for (int i = 1; i <= 2; i++) {
            additionalUsers.add(User.builder()
                    .username("gov.official" + i)
                    .password(passwordEncoder.encode("Password123!"))
                    .email("gov.official" + i + "@immunization.com")
                    .fullName("Government Official " + i)
                    .role(Role.GOVERNMENT_OFFICIAL)
                    .nationalId("NAT001")
                    .active(true)
                    .locked(false)
                    .failedLoginAttempts(0)
                    .createdAt(LocalDateTime.now())
                    .deleted(false)
                    .build());
        }

        userRepository.saveAll(additionalUsers);
        log.info("Seeded {} additional users", additionalUsers.size());
    }

    private List<Patient> seedPatients(PatientRepository patientRepository) {
        List<Patient> patients = new ArrayList<>();
        String[] firstNames = {"John", "Mary", "Peter", "Sarah", "James", "Lisa", "Michael", "Emma", "David", "Anna",
                "Robert", "Jennifer", "William", "Linda", "Richard", "Patricia", "Joseph", "Nancy", "Thomas", "Margaret"};
        String[] lastNames = {"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee"};
        String[] genders = {"Male", "Female"};
        String[] facilities = {"FAC001", "FAC002", "FAC003"};

        for (int i = 0; i < 50; i++) {
            String firstName = firstNames[random.nextInt(firstNames.length)];
            String lastName = lastNames[random.nextInt(lastNames.length)];
            String fullName = firstName + " " + lastName;
            String gender = genders[random.nextInt(genders.length)];
            LocalDate dateOfBirth = LocalDate.now().minusYears(random.nextInt(15)).minusDays(random.nextInt(365));
            String facilityId = facilities[random.nextInt(facilities.length)];

            Patient patient = Patient.builder()
                    .id(UUID.randomUUID())
                    .fullName(fullName)
                    .dateOfBirth(dateOfBirth)
                    .gender(gender)
                    .guardianName("Guardian of " + fullName)
                    .phoneNumber("+237" + String.format("%09d", random.nextInt(1000000000)))
                    .address(random.nextInt(500) + " Main Street, City " + random.nextInt(10))
                    .facilityId(facilityId)
                    .deleted(false)
                    .createdAt(LocalDateTime.now().minusDays(random.nextInt(180)))
                    .build();

            patients.add(patient);
        }

        return patientRepository.saveAll(patients);
    }

    private List<VaccineBatch> seedVaccineBatches(VaccineBatchRepository vaccineBatchRepository) {
        List<VaccineBatch> batches = new ArrayList<>();
        String[] vaccines = {"BCG", "Polio", "DTP", "Measles", "COVID-19", "Hepatitis B", "Rotavirus", "Tetanus"};
        String[] manufacturers = {"Pfizer", "Moderna", "AstraZeneca", "Johnson & Johnson", "Novavax", "Sanofi", "GSK", "Merck"};
        String[] facilities = {"FAC001", "FAC002", "FAC003"};

        int batchCounter = 1;
        for (String facility : facilities) {
            for (String vaccine : vaccines) {
                // Create 2-3 batches per vaccine per facility
                int numBatches = 2 + random.nextInt(2);
                for (int i = 0; i < numBatches; i++) {
                    LocalDate receiptDate = LocalDate.now().minusDays(random.nextInt(180));
                    LocalDate expiryDate = receiptDate.plusMonths(6 + random.nextInt(18));
                    int quantityReceived = 100 + random.nextInt(900);
                    int quantityUsed = random.nextInt(quantityReceived / 2);
                    
                    VaccineBatch batch = VaccineBatch.builder()
                            .batchNumber(String.format("BATCH-%s-%04d", vaccine.substring(0, 3).toUpperCase(), batchCounter++))
                            .vaccineName(vaccine)
                            .manufacturer(manufacturers[random.nextInt(manufacturers.length)])
                            .quantityReceived(quantityReceived)
                            .quantityRemaining(quantityReceived - quantityUsed)
                            .expiryDate(expiryDate)
                            .receiptDate(receiptDate)
                            .facilityId(facility)
                            .createdAt(LocalDateTime.now().minusDays(random.nextInt(180)))
                            .createdBy(1L)
                            .build();

                    batches.add(batch);
                }
            }
        }

        // Add some expired batches
        for (int i = 0; i < 5; i++) {
            String facility = facilities[random.nextInt(facilities.length)];
            String vaccine = vaccines[random.nextInt(vaccines.length)];
            LocalDate expiredDate = LocalDate.now().minusDays(random.nextInt(90) + 1);
            
            VaccineBatch expiredBatch = VaccineBatch.builder()
                    .batchNumber(String.format("BATCH-EXP-%04d", batchCounter++))
                    .vaccineName(vaccine)
                    .manufacturer(manufacturers[random.nextInt(manufacturers.length)])
                    .quantityReceived(100)
                    .quantityRemaining(random.nextInt(50))
                    .expiryDate(expiredDate)
                    .receiptDate(expiredDate.minusMonths(12))
                    .facilityId(facility)
                    .createdAt(LocalDateTime.now().minusDays(400))
                    .createdBy(1L)
                    .build();

            batches.add(expiredBatch);
        }

        return vaccineBatchRepository.saveAll(batches);
    }

    private List<Vaccination> seedVaccinations(VaccinationRepository vaccinationRepository, 
                                               List<Patient> patients, 
                                               List<VaccineBatch> batches) {
        List<Vaccination> vaccinations = new ArrayList<>();

        // Create vaccinations for each patient
        for (Patient patient : patients) {
            // Each patient gets 1-5 vaccinations
            int numVaccinations = 1 + random.nextInt(5);
            
            for (int i = 0; i < numVaccinations; i++) {
                // Find a batch from the same facility
                List<VaccineBatch> facilityBatches = batches.stream()
                        .filter(b -> b.getFacilityId().equals(patient.getFacilityId()) && 
                                    b.getQuantityRemaining() > 0 &&
                                    !b.isExpired())
                        .toList();

                if (facilityBatches.isEmpty()) continue;

                VaccineBatch batch = facilityBatches.get(random.nextInt(facilityBatches.size()));
                LocalDate vaccinationDate = patient.getDateOfBirth().plusMonths(i * 2 + 2);
                
                // Ensure vaccination date is not in the future
                if (vaccinationDate.isAfter(LocalDate.now())) {
                    vaccinationDate = LocalDate.now().minusDays(random.nextInt(30));
                }

                Vaccination vaccination = Vaccination.builder()
                        .patientId(patient.getId())
                        .batchId(batch.getId())
                        .nurseId(1L + random.nextInt(5))
                        .vaccineName(batch.getVaccineName())
                        .doseNumber(i + 1)
                        .dateAdministered(vaccinationDate)
                        .facilityId(patient.getFacilityId())
                        .notes("Routine immunization dose " + (i + 1))
                        .createdAt(LocalDateTime.now().minusDays(random.nextInt(180)))
                        .build();

                vaccinations.add(vaccination);

                vaccinations.add(vaccination);
            }
        }

        return vaccinationRepository.saveAll(vaccinations);
    }

    private List<Campaign> seedCampaigns(CampaignRepository campaignRepository) {
        List<Campaign> campaigns = new ArrayList<>();
        String[] campaignNames = {
                "COVID-19 Booster Campaign",
                "Measles Elimination Campaign",
                "Polio Eradication Drive",
                "Back-to-School Immunization",
                "Winter Flu Vaccination",
                "Tetanus Prevention Campaign",
                "HPV Vaccination Program",
                "Rotavirus Immunization Drive",
                "Hepatitis B Awareness Campaign",
                "DTP Catch-up Campaign",
                "National Immunization Week",
                "Mobile Clinic Outreach"
        };

        String[] vaccines = {"COVID-19", "Measles", "Polio", "DTP", "Tetanus", "HPV", "Rotavirus", "Hepatitis B"};
        String[] targetGroups = {
                "Children 0-5 years",
                "School-age children 6-12 years",
                "Adolescents 13-18 years",
                "Adults 18-65 years",
                "Pregnant women",
                "Healthcare workers",
                "Elderly 65+ years"
        };
        String[] facilities = {"FAC001", "FAC002", "FAC003"};
        Campaign.CampaignStatus[] statuses = {
                Campaign.CampaignStatus.PLANNED,
                Campaign.CampaignStatus.ACTIVE,
                Campaign.CampaignStatus.ACTIVE,
                Campaign.CampaignStatus.COMPLETED,
                Campaign.CampaignStatus.CANCELLED
        };

        for (int i = 0; i < campaignNames.length; i++) {
            LocalDate startDate = LocalDate.now().minusDays(random.nextInt(180));
            LocalDate endDate = startDate.plusDays(30 + random.nextInt(60));
            int targetPopulation = 500 + random.nextInt(2500);
            int vaccinatedCount = random.nextInt(targetPopulation);
            Campaign.CampaignStatus status = statuses[random.nextInt(statuses.length)];

            // Adjust dates based on status
            if (status == Campaign.CampaignStatus.PLANNED) {
                startDate = LocalDate.now().plusDays(random.nextInt(30));
                endDate = startDate.plusDays(30 + random.nextInt(60));
                vaccinatedCount = 0;
            } else if (status == Campaign.CampaignStatus.COMPLETED) {
                endDate = LocalDate.now().minusDays(random.nextInt(30));
            }

            Campaign campaign = Campaign.builder()
                    .name(campaignNames[i])
                    .description("Campaign targeting " + targetGroups[random.nextInt(targetGroups.length)] + 
                               " to improve vaccination coverage in the region.")
                    .vaccineName(vaccines[random.nextInt(vaccines.length)])
                    .targetAgeGroup(targetGroups[random.nextInt(targetGroups.length)])
                    .startDate(startDate)
                    .endDate(endDate)
                    .targetPopulation(targetPopulation)
                    .vaccinatedCount(vaccinatedCount)
                    .status(status)
                    .facilityId(facilities[random.nextInt(facilities.length)])
                    .districtId("DIST00" + (random.nextInt(3) + 1))
                    .nationalId("NAT001")
                    .createdAt(LocalDateTime.now().minusDays(random.nextInt(200)))
                    .createdBy(2L)
                    .updatedAt(LocalDateTime.now().minusDays(random.nextInt(30)))
                    .build();

            campaigns.add(campaign);
        }

        return campaignRepository.saveAll(campaigns);
    }
}
