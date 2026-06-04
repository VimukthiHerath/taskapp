package models

import "time"

type Task struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title" gorm:"not null"`
	Completed bool      `json:"completed" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
}