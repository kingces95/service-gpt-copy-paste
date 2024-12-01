
# Ephemeral Workflow and Secret Management

This document outlines the process of creating, deploying, executing, and cleaning up ephemeral workflows and secrets in Google Cloud.

---

## **1. Setup: Service Account for Workflows**

### Create the Service Account
```bash
gcloud iam service-accounts create workflow-runner \
    --description="Service account for running ephemeral workflows" \
    --display-name="Workflow Runner"
```

### Grant Required Roles
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:workflow-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/workflows.invoker"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:workflow-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:workflow-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/logging.logWriter"
```

---

## **2. Generating Unique IDs**

Generate a unique ID to prevent collisions:
```bash
UNIQUE_ID=$(uuidgen | tr -d '-' | head -c 8)
```

Use `$UNIQUE_ID` for:
- Secrets: `trello-api-key-${UNIQUE_ID}` and `trello-token-${UNIQUE_ID}`
- Workflow: `secure-enumerate-boards-${UNIQUE_ID}`

---

## **3. Workflow Lifecycle Management**

### **a. Push Secrets**
```bash
echo -n "your-trello-api-key" | gcloud secrets create trello-api-key-${UNIQUE_ID} --data-file=-
echo -n "your-trello-token" | gcloud secrets create trello-token-${UNIQUE_ID} --data-file=-
```

Grant the **workflow-runner service account** access:
```bash
gcloud secrets add-iam-policy-binding trello-api-key-${UNIQUE_ID} \
    --member="serviceAccount:workflow-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding trello-token-${UNIQUE_ID} \
    --member="serviceAccount:workflow-runner@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### **b. Deploy the Workflow**
```bash
gcloud workflows deploy secure-enumerate-boards-${UNIQUE_ID} \
    --location=us-central1 \
    --source=outputs/expanded_workflow.yaml
```

### **c. Execute the Workflow**
```bash
gcloud workflows execute secure-enumerate-boards-${UNIQUE_ID} \
    --location=us-central1 \
    --format=json
```

### **d. Cleanup: Delete the Workflow**
```bash
gcloud workflows delete secure-enumerate-boards-${UNIQUE_ID} \
    --location=us-central1 --quiet
```

### **e. Cleanup: Delete Secrets**
```bash
gcloud secrets delete trello-api-key-${UNIQUE_ID} --quiet
gcloud secrets delete trello-token-${UNIQUE_ID} --quiet
```

---

## **4. Orphaned Resource Cleanup**

### List and Delete Workflows Older Than 1 Hour
```bash
gcloud workflows list --location=us-central1 \
    --filter="createTime < $(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')" \
    --format="value(name)" | xargs -I {} gcloud workflows delete {} --quiet
```

### List and Delete Secrets Older Than 1 Hour
```bash
gcloud secrets list \
    --filter="createTime < $(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')" \
    --format="value(name)" | xargs -I {} gcloud secrets delete {} --quiet
```

---

## **5. Suggestions for Async Cleanup**

### Option 1: Scheduled Cleanup Job
Use **Cloud Scheduler** to invoke a cleanup script every hour.
1. Write a cleanup script (`cleanup.sh`).
2. Schedule it:
    ```bash
    gcloud scheduler jobs create cron cleanup-resources \
        --schedule="0 * * * *" \
        --uri="https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/cleanup-resources" \
        --http-method=POST
    ```

### Option 2: Event-Driven Cleanup
Trigger cleanup after workflow completion using **Cloud Functions** or **Cloud Pub/Sub**.

---

## **6. Full Script Example**

```bash
#!/bin/bash

PROJECT_ID="YOUR_PROJECT_ID"
UNIQUE_ID=$(uuidgen | tr -d '-' | head -c 8)

# Push secrets
gcloud secrets create trello-api-key-${UNIQUE_ID} --data-file=- <<< "your-trello-api-key"
gcloud secrets create trello-token-${UNIQUE_ID} --data-file=- <<< "your-trello-token"

# Grant access to service account
gcloud secrets add-iam-policy-binding trello-api-key-${UNIQUE_ID} \
    --member="serviceAccount:workflow-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding trello-token-${UNIQUE_ID} \
    --member="serviceAccount:workflow-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Deploy workflow
gcloud workflows deploy secure-enumerate-boards-${UNIQUE_ID} \
    --location=us-central1 \
    --source=outputs/expanded_workflow.yaml

# Execute workflow
gcloud workflows execute secure-enumerate-boards-${UNIQUE_ID} \
    --location=us-central1 \
    --format=json

# Cleanup
gcloud workflows delete secure-enumerate-boards-${UNIQUE_ID} --location=us-central1 --quiet
gcloud secrets delete trello-api-key-${UNIQUE_ID} --quiet
gcloud secrets delete trello-token-${UNIQUE_ID} --quiet
```

---

## **Summary**

This approach ensures:
1. **Ephemeral Resources**: Fully temporary workflows and secrets for each user.
2. **Unique Resource Names**: Prevents collisions using unique IDs.
3. **Automated Cleanup**: Orphans are handled via scheduled jobs or event-driven logic.
4. **Scoped Access**: Secrets and workflows are only accessible by the service account during execution.
