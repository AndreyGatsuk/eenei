package preview

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

// Project is a named entry returned by the API.
type Project struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Archived bool   `json:"archived"`
}

func LoadProjects(ctx context.Context, url string) ([]Project, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("load projects: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %d", response.StatusCode)
	}
	var projects []Project
	err = json.NewDecoder(response.Body).Decode(&projects)
	return projects, err
}
