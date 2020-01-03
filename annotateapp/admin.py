from django.contrib import admin

# Register your models here.
from annotateapp.models import *
# Project, PersonKind, Person, RecordingSession, Trial, WordCandidate, Evaluation

class WordCandidateAdmin(admin.ModelAdmin):
    raw_id_fields = ("trial",)

class RetrimmingAdmin(admin.ModelAdmin):
    raw_id_fields = ("previous","result",)

class EvaluationAdmin(admin.ModelAdmin):
    raw_id_fields = ("word_candidate",)

admin.site.register(Project)
admin.site.register(PersonKind)
admin.site.register(Person)
admin.site.register(RecordingSession)
admin.site.register(Trial)
admin.site.register(Chunk)
admin.site.register(OrthographicTranscription)
admin.site.register(TrialDetails)
admin.site.register(TrialDetailsCorrected)
admin.site.register(WordCandidate,WordCandidateAdmin)
admin.site.register(WordCandidateToBeChecked)
admin.site.register(Evaluation,EvaluationAdmin)
admin.site.register(Retrimming,RetrimmingAdmin)
admin.site.register(RetrimmingList,RetrimmingAdmin)
