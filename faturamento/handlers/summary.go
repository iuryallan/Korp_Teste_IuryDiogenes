package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/iuryallan/faturamento/models"
	"gorm.io/gorm"
)

type SummaryHandler struct {
	DB *gorm.DB
}

func NewSummaryHandler(db *gorm.DB) *SummaryHandler {
	return &SummaryHandler{DB: db}
}

type GroqRequest struct {
	Model    string        `json:"model"`
	Messages []GroqMessage `json:"messages"`
}

type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type GroqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (h *SummaryHandler) GenerateSummary(c *gin.Context) {
	var invoices []models.Invoice
	h.DB.Preload("Items").Find(&invoices)

	if len(invoices) == 0 {
		c.JSON(http.StatusOK, gin.H{"summary": "Nenhuma nota fiscal encontrada para resumir."})
		return
	}

	var sb strings.Builder
	sb.WriteString("Aqui estão as notas fiscais do sistema:\n\n")

	for _, inv := range invoices {
		sb.WriteString(fmt.Sprintf("Nota #%d — Status: %s\n", inv.Number, inv.Status))
		for _, item := range inv.Items {
			sb.WriteString(fmt.Sprintf("  - %s (%s): %.0f unidade(s)\n",
				item.ProductDescription, item.ProductCode, item.Quantity))
		}
		sb.WriteString("\n")
	}

	prompt := fmt.Sprintf(`%s
		Com base nessas informações, gere um resumo executivo em português em 3 a 5 frases cobrindo:
		- Quantas notas existem e quantas estão abertas ou fechadas
		- Quais produtos aparecem com mais frequência
		- Qual o volume total movimentado
	Seja direto e objetivo, como um relatório gerencial.`, sb.String())

	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Groq API key not configured"})
		return
	}

	reqBody, _ := json.Marshal(GroqRequest{
		Model: "llama-3.3-70b-versatile",
		Messages: []GroqMessage{
			{Role: "user", Content: prompt},
		},
	})

	req, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Failed to reach Groq API"})
		return
	}
	defer resp.Body.Close()

	var groqResp GroqResponse
	json.NewDecoder(resp.Body).Decode(&groqResp)

	if len(groqResp.Choices) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Empty response from AI"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": groqResp.Choices[0].Message.Content})
}