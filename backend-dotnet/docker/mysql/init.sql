-- IQC MySQL init — charset + user privileges
CREATE DATABASE IF NOT EXISTS iqc
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON iqc.* TO 'iqc'@'%';
FLUSH PRIVILEGES;
