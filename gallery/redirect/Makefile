PROJECT := cocopy
GCLOUD := gcloud beta --project $(PROJECT)

.PHONY: deploy
deploy:
	$(GCLOUD) functions deploy redirect \
		--entry-point=app \
		--runtime=nodejs14 \
		--trigger-http \
		--allow-unauthenticated
