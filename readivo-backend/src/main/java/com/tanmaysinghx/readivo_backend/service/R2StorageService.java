package com.tanmaysinghx.readivo_backend.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.core.retry.RetryPolicy;

import java.time.Duration;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class R2StorageService {

    @Value("${cloudflare.r2.endpoint}")
    private String endpoint;

    @Value("${cloudflare.r2.bucket-name}")
    private String bucketName;

    @Value("${cloudflare.r2.access-key:}")
    private String accessKey;

    @Value("${cloudflare.r2.secret-key:}")
    private String secretKey;

    @Value("${cloudflare.r2.public-url-prefix}")
    private String publicUrlPrefix;

    private S3Client s3Client;
    private boolean useR2 = false;
    private Path localUploadPath;

    @PostConstruct
    public void init() {
        // Check if R2 credentials are provided
        if (accessKey != null && !accessKey.trim().isEmpty() && secretKey != null && !secretKey.trim().isEmpty()) {
            try {
                log.info("Initializing Cloudflare R2 storage client with endpoint: {}", endpoint);
                s3Client = S3Client.builder()
                        .endpointOverride(URI.create(endpoint))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKey, secretKey)))
                        .region(Region.US_EAST_1) // Required by SDK, ignored by R2
                        .serviceConfiguration(S3Configuration.builder()
                                .pathStyleAccessEnabled(true) // Path style access matches R2 best
                                .build())
                        .overrideConfiguration(ClientOverrideConfiguration.builder()
                                .apiCallAttemptTimeout(Duration.ofSeconds(1))
                                .apiCallTimeout(Duration.ofSeconds(2))
                                .retryPolicy(RetryPolicy.none()) // Disable retries to fail-fast
                                .build())
                        .build();
                useR2 = true;
                log.info("Cloudflare R2 storage client initialized successfully with fail-fast timeouts.");
            } catch (Exception e) {
                log.error("Failed to initialize Cloudflare R2 client. Falling back to local storage.", e);
            }
        } else {
            log.warn("Cloudflare R2 credentials (access-key/secret-key) are missing. Falling back to local storage.");
        }

        // Initialize local fallback directory
        try {
            localUploadPath = Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath();
            if (!Files.exists(localUploadPath)) {
                Files.createDirectories(localUploadPath);
            }
            log.info("Local upload fallback directory initialized at: {}", localUploadPath);
        } catch (IOException e) {
            log.error("Failed to create local uploads directory!", e);
        }
    }

    /**
     * Uploads a file and returns its public access URL.
     */
    public String uploadFile(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        // Generate unique file name to prevent collisions
        String uniqueFileName = UUID.randomUUID().toString() + extension;

        // Read file bytes into memory to support multiple reads (reliable fallback)
        byte[] fileBytes = file.getBytes();

        if (useR2 && s3Client != null) {
            return uploadToR2(fileBytes, uniqueFileName, file.getContentType());
        } else {
            return saveLocally(fileBytes, uniqueFileName);
        }
    }

    private String uploadToR2(byte[] fileBytes, String fileName, String contentType) throws IOException {
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(contentType)
                    .build();

            log.info("Uploading file {} to Cloudflare R2 bucket {}", fileName, bucketName);
            s3Client.putObject(putObjectRequest, 
                    RequestBody.fromBytes(fileBytes));

            String fileUrl = publicUrlPrefix + "/" + fileName;
            log.info("File uploaded successfully to R2. URL: {}", fileUrl);
            return fileUrl;
        } catch (Exception e) {
            log.error("Failed to upload file to Cloudflare R2 due to SSL or network error. Attempting local fallback...", e);
            return saveLocally(fileBytes, fileName);
        }
    }

    private String saveLocally(byte[] fileBytes, String fileName) throws IOException {
        if (localUploadPath == null) {
            throw new IOException("Local upload path is not initialized.");
        }

        Path targetLocation = localUploadPath.resolve(fileName);
        log.info("Saving file locally to {}", targetLocation);
        
        Files.write(targetLocation, fileBytes);
        
        // Return local URL served by Spring Boot
        String localUrl = "http://localhost:8080/uploads/" + fileName;
        log.info("File saved locally. URL: {}", localUrl);
        return localUrl;
    }
}
