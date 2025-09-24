package com.organicnow.backend.dto;

import java.time.LocalDateTime;

public class RequestDto {
    private Long id;
    private String issueTitle;
    private String issueDescription;
    private LocalDateTime createDate;
    private LocalDateTime scheduledDate;
    private LocalDateTime finishDate;

    public RequestDto() {}

    public RequestDto(Long id, String issueTitle, String issueDescription,
                      LocalDateTime createDate, LocalDateTime scheduledDate, LocalDateTime finishDate) {
        this.id = id;
        this.issueTitle = issueTitle;
        this.issueDescription = issueDescription;
        this.createDate = createDate;
        this.scheduledDate = scheduledDate;
        this.finishDate = finishDate;
    }

    // ===== Getters & Setters =====
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIssueTitle() { return issueTitle; }
    public void setIssueTitle(String issueTitle) { this.issueTitle = issueTitle; }

    public String getIssueDescription() { return issueDescription; }
    public void setIssueDescription(String issueDescription) { this.issueDescription = issueDescription; }

    public LocalDateTime getCreateDate() { return createDate; }
    public void setCreateDate(LocalDateTime createDate) { this.createDate = createDate; }

    public LocalDateTime getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDateTime scheduledDate) { this.scheduledDate = scheduledDate; }

    public LocalDateTime getFinishDate() { return finishDate; }
    public void setFinishDate(LocalDateTime finishDate) { this.finishDate = finishDate; }
}
