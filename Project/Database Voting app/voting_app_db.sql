-- Drop the database if it exists to start fresh (optional)
DROP DATABASE IF EXISTS voting_app_db;

-- Create the database
CREATE DATABASE voting_app_db;

-- Select the database to use
USE voting_app_db;

-- -----------------------------------------------------
-- Table `users`
-- Stores user login information.
-- -----------------------------------------------------
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE);


-- -----------------------------------------------------
-- Table `candidates`
-- Stores the candidates and their vote counts.
-- -----------------------------------------------------
CREATE TABLE `candidates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `votes` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`));


-- -----------------------------------------------------
-- Table `voted_users`
-- Records which user has voted to prevent multiple votes.
-- -----------------------------------------------------
CREATE TABLE `voted_users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC) VISIBLE,
  CONSTRAINT `fk_voted_users_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE);


-- -----------------------------------------------------
-- Table `settings`
-- Stores global settings for the election, like its status.
-- -----------------------------------------------------
CREATE TABLE `settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `results_declared` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`));

-- Insert a default settings row required for the app to function
INSERT INTO `settings` (`id`, `results_declared`) VALUES (1, 0);

SELECT * FROM candidates;

SET SQL_SAFE_UPDATES = 0;

UPDATE candidates 
SET votes = 10 
WHERE name = 'Vasudev';
