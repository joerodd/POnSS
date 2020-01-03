from __future__ import unicode_literals

import numpy as np
import random
import datetime
import time
import os
from django.conf import settings
from django.db import models
from django.db.models import Count
from django.contrib.auth.models import User
from django.core.cache import cache
import xml.etree.ElementTree as ET
from annotateapp.utils import TextGrid, remove_empty_lines

# Create your models here.

class Project(models.Model):
	def __unicode__(self):
		return str(self.name)
	name = models.CharField(max_length=40,blank=False)
	description = models.CharField(max_length=400,blank=True)
	contact_person = models.CharField(max_length=40,blank=False)
	open = models.BooleanField(default=False)
	mode_expert = models.BooleanField(default=False)
	mode_naive = models.BooleanField(default=False)
	mode_player = models.BooleanField(default=False)
	vocabulary = models.CharField(max_length = 1000, null=True, default = "")

class PersonKind(models.Model):
	def __unicode__(self):
		return str(self.name)
	name = models.CharField(max_length=40,blank=False)
	description = models.CharField(max_length=400,blank=True)
	mode_expert = models.BooleanField(default=False)
	mode_naive = models.BooleanField(default=False)
	mode_player = models.BooleanField(default=False)

class Person(models.Model):
	def __unicode__(self):
		if self.name != "":
			return str(self.name)
		elif self.mpi_pp_code != "":
			return u"mpi" + str(self.mpi_pp_code) + ": " + str(self.experimental_id)
		else:
			return str(self.pk)
	kind = models.ForeignKey(PersonKind, related_name='participant_kind')
	associated_auth_user = models.OneToOneField(User, blank = True, null=True)
	experimental_id = models.CharField(max_length=10,blank=True)
	name = models.CharField(max_length=40,blank=True)
	sex = models.CharField(max_length=7,default="unknown", blank=False,choices=(("male","male"),("female","female"),("unknown","unknown")))
	date_of_birth = models.DateField(blank=True,null=True)
	mpi_pp_code = models.CharField(max_length=10,blank=True)

class RecordingSession(models.Model):
	def __unicode__(self):
		return u"Session " + str(self.pk) + u", project " + str(self.project.pk)
	project = models.ForeignKey(Project,blank=False,related_name="project")
	speaker = models.ForeignKey(Person,blank=False,related_name = "speaker_person")
	experimenter = models.ForeignKey(Person,blank=False,related_name = "experimenter_person")
	session_end_time = models.DateTimeField(blank=True,null=True)

class TrialsManager(models.Manager):

	def draw_random_for_error(self):
		valid_targets = None
		# valid_targets = cache.get('valid_targets_errors')
		# valid_targets_len = cache.get('valid_targets_errors_len')
		if valid_targets == None:
			valid_targets = self.filter(current=True)

			valid_targets_len = len(valid_targets)
			# cache.set('valid_targets_errors', valid_targets, 1200)
			# cache.set('valid_targets_errors_len', valid_targets_len, 1200)
		valid = False
		attempts = 0
		target = None
		while not valid and attempts < 50:
			target = valid_targets[random.randint(0, valid_targets_len - 1)]
			if target.is_current():
				valid = True
			attempts += 1
		return target

class Trial(models.Model):
	objects = TrialsManager()
	def __unicode__(self):
		return str(self.experimental_trial_id)
	experimental_trial_id = models.CharField(max_length=80,default="",blank=True)
	experimental_condition = models.CharField(max_length=80,default="",blank=True)
	session = models.ForeignKey(RecordingSession,blank=True,null=True)
	speech_filename = models.CharField(max_length=80,default="",blank=True)
	beep_filename = models.CharField(max_length=80,default="",blank=True)
	combined_filename = models.CharField(max_length=80,default="",blank=True)
	wa_origin = models.DecimalField(max_digits = 15, decimal_places = 6,blank=True)
	et_origin = models.DecimalField(max_digits = 15, decimal_places = 6,blank=True)
	interest_onset = models.DecimalField(max_digits = 15, decimal_places = 6,blank=True)
	interest_offset = models.DecimalField(max_digits = 15, decimal_places = 6,blank=True)
	current = models.BooleanField(default=True)
	image = models.CharField(max_length=100, default="", blank=True, null=True)
	audio = models.CharField(max_length=100, default="", blank=True, null=True)

	def is_current(self):
		if self.session.project.open and len(TrialDetailsCorrected.objects.filter(trial=self))==0:
			current = True
		else:
			current = False
		self.current = current
		self.save()
		return current

class TrialDetails(models.Model):
	def __unicode__(self):
		return(str(self.trial.experimental_trial_id))
	trial = models.OneToOneField(Trial)
	trial_id_within = models.IntegerField(blank = True)
	trial_order_session = models.IntegerField(blank = True)
	log_file = models.CharField(max_length=60)
	duration = models.IntegerField(blank = True)
	f1 = models.CharField(max_length=30)
	t2 = models.CharField(max_length=30)
	t3 = models.CharField(max_length=30)
	t4 = models.CharField(max_length=30)
	t5 = models.CharField(max_length=30)
	t6 = models.CharField(max_length=30)
	f7 = models.CharField(max_length=30)
	f8 = models.CharField(max_length=30)

class TrialDetailsCorrected(models.Model):
	def __unicode__(self):
		return(str(self.trial.experimental_trial_id))
	trial = models.OneToOneField(Trial)
	evaluator = models.ForeignKey(Person, blank=True)
	timestamp = models.DateTimeField()
	listens = models.IntegerField(default=0)
	RT = models.IntegerField(default=0)
	f1 = models.CharField(max_length=60)
	t2 = models.CharField(max_length=60)
	t3 = models.CharField(max_length=60)
	t4 = models.CharField(max_length=60)
	t5 = models.CharField(max_length=60)
	f8 = models.CharField(max_length=60)
	t6 = models.CharField(max_length=60)
	f7 = models.CharField(max_length=60)

class ChunksManager(models.Manager):
	def draw_random(self):
		valid_targets = self.filter(labelled=False, rejected=False,replaced=False, current=True).exclude(audio="")

		valid_targets_len = valid_targets.count()

		if valid_targets_len > 300:
			ortho_recent_session = cache.get('ortho_recent_session', False)
			if ortho_recent_session:
				valid_targets2 = valid_targets.filter(trial__session = ortho_recent_session)
				if valid_targets2.count() > 2:
					valid_targets = valid_targets2

		valid_targets_len = valid_targets.count()

		target = valid_targets[random.randint(0, valid_targets_len - 1)]
		cache.set('ortho_recent_session', target.trial.session,240)
		return target



class Chunk(models.Model):
	objects = ChunksManager()
	def __unicode__(self):
		return (str(self.trial.id) + u"-chunk" + str(self.chunk_index) + "(" + str(self.id) + ")")
	trial = models.ForeignKey(Trial)
	chunk_index = models.IntegerField()
	current = models.BooleanField(default=True)
	rejected = models.BooleanField(default=False)
	replaced = models.BooleanField(default=False)
	new_chunk = models.ForeignKey("self", blank=True, null=True, related_name="new_chunk_self")
	labelled = models.BooleanField(default=False)
	maused = models.BooleanField(default=False)
	orthographic_transcription = models.CharField(max_length=1000, blank=True, null=True)
	chunk_onset_time = models.DecimalField(max_digits = 6, decimal_places = 1)
	chunk_offset_time = models.DecimalField(max_digits=6, decimal_places=1)
	image = models.CharField(max_length=100, default="", blank=True, null=True)
	audio = models.CharField(max_length=100, default="", blank=True, null=True)
	maus = models.CharField(max_length=100, default="", blank=True, null=True)
	def is_current(self):
		if self.trial.session.project.open and not self.new_chunk:
			current = True
		else:
			current = False
		self.current = current
		self.save()
		return current
	def do_maus(self):
		# do g2p
		tempfile = settings.MEDIA_ROOT + time.strftime("%Y%m%d-%H%M%S")
		orthographic_filename = tempfile + ".orthotxt"
		par_filename = tempfile + ".par"

		mau_filename = "chunkmaus_" + \
					   str(self.pk) + "_" + self.trial.experimental_trial_id + \
					   "_chunk" + str(self.chunk_index) + ".mau"

		ortho_file = open(orthographic_filename, "w")
		ortho_file.write(self.orthographic_transcription)
		ortho_file.close()
		curl_command_g2p = "curl -v -X POST -H 'content-type: multipart/form-data' -F com=no -F lng=nld -F stress=no -F i=@" + orthographic_filename + " -F tgitem=ort -F align=no -F featset=standard -F iform=txt -F embed=no -F oform=bpf 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/services/runG2P'"

		xml_ortho = os.popen(curl_command_g2p).read()
		par_location = ET.fromstring(xml_ortho)[1].text
		os.popen("curl " + par_location + " > " + par_filename)

		curl_command_maus = "curl -v -X POST -H 'content-type: multipart/form-data' -F LANGUAGE=nld -F SIGNAL=@" + settings.MEDIA_ROOT + "chunkrecordings/" + self.audio + " -F INSKANTEXTGRID=false -F MODUS=standard -F RELAXMINDUR=false -F OUTFORMAT=TextGrid -F INSORTTEXTGRID=true -F INSKANTEXTGRID=true -F TARGETRATE=100000 -F ENDWORD=999999 -F STARTWORD=0 -F INSYMBOL=sampa -F PRESEG=false -F USETRN=false -F BPF=@" + par_filename + " -F OUTFORMAT=bpf -F MAUSSHIFT=default -F INSPROB=0.0 -F INSORTTEXTGRID=false -F MINPAUSLEN=5 -F OUTSYMBOL=sampa -F WEIGHT=default -F NOINITIALFINALSILENCE=true 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/services/runMAUS'"

		xml_maus = os.popen(curl_command_maus).read()
		mau_location = ET.fromstring(xml_maus)[1].text
		os.popen("curl " + mau_location + " > " + settings.MEDIA_ROOT + "chunktranscripts/" + mau_filename)
		os.remove(orthographic_filename)
		os.remove(par_filename)
		self.maus = mau_filename
		self.save()
	def make_wcs(self):
		# read text grid and make wcs
		with open(settings.MEDIA_ROOT + "chunktranscripts/" + self.maus, "rb") as f:
			textgrid = TextGrid(remove_empty_lines(f.readlines()))

		for item in textgrid.tier_list[0]['items']:
			if item['text'] in self.trial.session.project.vocabulary.split(" "):
				if float(item['xmax']) - float(item['xmin']) > 0.2:
					new_wc = WordCandidate(
						trial=self.trial,
						label=item['text'],
						onset=float(self.chunk_onset_time) + float(item['xmin']) * 1000,
						offset=float(self.chunk_onset_time) + float(item['xmax']) * 1000,
						creation_mode="chunkmaus",
						word_class="experimental"
					)
					new_wc.save()

	def make_hesitations(self):
		# read text grid and make hesitation wcs
		with open(settings.MEDIA_ROOT + "chunktranscripts/" + self.maus, "rb") as f:
			textgrid = TextGrid(remove_empty_lines(f.readlines()))

		for item in textgrid.tier_list[0]['items']:
			if item['text'] not in self.trial.session.project.vocabulary.split(" "):
				if float(item['xmax']) - float(item['xmin']) > 0.2:
					new_wc = WordCandidate(
						trial=self.trial,
						label=item['text'],
						onset=float(self.chunk_onset_time) + float(item['xmin']) * 1000,
						offset=float(self.chunk_onset_time) + float(item['xmax']) * 1000,
						creation_mode="chunkmaus",
						word_class="hesitation"
					)
					new_wc.save()


class Fixation(models.Model):
	def __unicode__(self):
		return(str(self.trial.trial_id) + u"-" + str(self.interest_area))
	trial = models.ForeignKey(Trial)
	interest_area = models.CharField(max_length=4)
	gaze_start_et = models.DecimalField(max_digits = 6, decimal_places = 1)
	gaze_end_et = models.DecimalField(max_digits = 6, decimal_places = 1)
	gaze_midpoint_et = models.DecimalField(max_digits = 6, decimal_places = 1)

class WordCandidatesManager(models.Manager):
	def count_current(self):
		return 9999
		current_targets = cache.get('current_targets')
		if current_targets == None:
			current_targets = len(self.filter(word_class = "experimental", current=True))
		# 	if current_targets < 100:
		# 		cache.set('current_targets', current_targets, 240)
		# 	else:
		# 		cache.set('current_targets', current_targets, 1200)
		# 	if current_targets > 800:
		# 		cache.set('current_targets', current_targets, 3600)
		# return current_targets

	def calculate_quantile(self, quant=1):
		quantile = cache.get('quantile')
		if quantile == None:
			eval_counts = [obj.evaluations for obj in self.all().iterator() if obj.is_current() and obj.rejected == False and obj.word_class != "filler"]
			quantile = np.percentile(eval_counts,quant)
			cache.set('quantile', quantile, 80000)
		return quantile

	def draw_random(self, quantile):
		valid_targets = self.filter(rejected=False, word_class="experimental", current=True,
									 evaluations__lte=0).exclude(creation_mode="expert")
		# valid_targets = self.filter(rejected=False, word_class="experimental", current=True, evaluations__lte=0)
		valid_targets_len = valid_targets.count()
		triage_recent_session = False
		if valid_targets_len > 300:
			triage_recent_session = cache.get('triage_recent_session', False)
			if triage_recent_session:
				valid_targets2 = valid_targets.filter(trial__session = triage_recent_session)
				if valid_targets2.count() > 2:
					valid_targets = valid_targets2

		valid_targets_len = valid_targets.count()

		valid = False
		while not valid:
			target = valid_targets[random.randint(0, valid_targets_len - 1)]
			if target.evaluation_count() <= 0 and target.is_current():
				valid = True
		if triage_recent_session:
			if valid_targets2.count() > 1:
				cache.set('triage_recent_session', target.trial.session, 60)
			else:
				cache.delete('triage_recent_session')
		return target

	def draw_random_retrim(self):
		# valid_targets = cache.get('valid_targets_retrim')
		# valid_targets_len = cache.get('valid_targets_retrim_len')
		# targets_in_progress = cache.get('targets_in_progress_retrim')
		# if valid_targets == None:
			# if targets_in_progress:
			# 	while targets_in_progress:
			# 		time.sleep(3)
			# 	valid_targets = cache.get('valid_targets_retrim')
			# 	valid_targets_len = cache.get('valid_targets_retrim_len')
			# else:
			# cache.set('targets_in_progress_retrim', True)
			# valid_targets1 = [obj for obj in self.filter(rejected = False, word_class = "experimental", creation_mode = "annotator").iterator() if obj.current_rating() <= 0.5 and obj.is_current()]
		valid_targets =  self.filter(rejected = False, word_class = "experimental",evaluations__gte=1,rating__lte=0.5,current=True)


		valid_targets_len = len(valid_targets)
			# cache.set('valid_targets_retrim', valid_targets, 1200)
			# cache.set('valid_targets_retrim_len', valid_targets_len, 1200)
			# cache.set('targets_in_progress_retrim', False)
		valid = False
		while not valid:
			target = valid_targets[random.randint(0, valid_targets_len - 1)]
			if target.is_current():
				valid = True
		return target

	def draw_random_from_list(self):
		to_be_checked = [obj for obj in WordCandidateToBeChecked.objects.iterator() if obj.done == 0]
		target = to_be_checked[random.randint(0, len(to_be_checked) - 1)]
		return target

class WordCandidate(models.Model):
	objects = WordCandidatesManager()
	def __unicode__(self):
		return str(self.trial.experimental_trial_id) + u"-" + str(self.label) + u" (" + self.creation_mode + u": " + self.word_class + u")"
	trial = models.ForeignKey(Trial,blank=False)
	label = models.CharField(max_length=50,default="",blank=False)
	onset = models.DecimalField(max_digits = 15, decimal_places = 6)
	offset = models.DecimalField(max_digits = 15, decimal_places = 6)
	image = models.CharField(max_length=100,default="",blank=True,null=True)
	audio = models.CharField(max_length=100,default="",blank=True,null=True)
	image_retrim = models.CharField(max_length=100,default="",blank=True,null=True)
	audio_retrim = models.CharField(max_length=100,default="",blank=True,null=True)
	rejected = models.BooleanField(default=False)
	evaluations = models.IntegerField(default=0)
	# number_of_evaluations = models.IntegerField(default=0)
	creation_mode = models.CharField(max_length=15,choices=(
		("chunkmaus","chunkmaus"),
		("recogniser","recogniser"),
		("annotator","annotator"),
		("expert","expert"),
		("naive","naive"),
		("player","player")))
	word_class = models.CharField(max_length=15,choices=(
		("hesitation", "hesitation"),
		("experimental","experimental"),
		("filler","filler")),blank = True, null = True)
	rating = models.DecimalField(max_digits=10,decimal_places=6,default=0)
	current = models.BooleanField(default=True)


	def predecessor(self):
		return [b.previous for b in Retrimming.objects.filter(result = self)][0]
	def successor(self):
		return [b.result for b in Retrimming.objects.filter(previous = self)][0]

	def is_current(self):
		if self.trial.session.project.open:
			current = len(Retrimming.objects.filter(previous = self)) == 0
		else:
			current = False

		self.current = current
		self.save()
		return (current)

	def evaluation_count(self):
		count = len([evaluation.good for evaluation in Evaluation.objects.filter(word_candidate = self)])
		self.evaluations= count
		self.save()
		return (count)

	def current_rating(self):
		ratings = [evaluation.good for evaluation in Evaluation.objects.filter(word_candidate = self)]
		if len(ratings) == 0:
			rating = 0
		else:
			rating = len([b for b in ratings if b is True])/len(ratings)

		self.rating = rating
		self.save()
		return(rating)

class WordCandidateToBeChecked(models.Model):
	word_candidate = models.ForeignKey(WordCandidate,blank=False)
	reason = models.CharField(max_length=30,default="",blank=False)
	done = models.IntegerField(default=0,blank=False)

class Retrimming(models.Model):
	def __unicode__(self):
		return self.timestamp.strftime("%Y-%m-%d %H:%M:%S") + u" " + str(self.result.label) + u" " + str(self.evaluator.name)
	previous = models.ForeignKey(WordCandidate,blank=True,null=True,related_name="previous")
	result = models.ForeignKey(WordCandidate,blank=True,null=True,related_name="result")
	evaluator = models.ForeignKey(Person,blank=True)
	timestamp = models.DateTimeField()
	listens = models.IntegerField(default=0)
	RT = models.IntegerField(default=0)

class RetrimmingList(models.Model):
	def __unicode__(self):
		return self.timestamp.strftime("%Y-%m-%d %H:%M:%S") + u" " + str(self.result.label) + u" " + str(self.evaluator.name)
	previous = models.ForeignKey(WordCandidate,blank=True,null=True,related_name="listprevious")
	result = models.ForeignKey(WordCandidate,blank=True,null=True,related_name="listresult")
	evaluator = models.ForeignKey(Person,blank=True)
	timestamp = models.DateTimeField()
	listens = models.IntegerField(default=0)
	RT = models.IntegerField(default=0)


class Evaluation(models.Model):
	def __unicode__(self):
		return self.timestamp.strftime("%Y-%m-%d %H:%M:%S") + u" " + str(self.word_candidate.label) + u" " + str(self.evaluator.name)
	word_candidate = models.ForeignKey(WordCandidate,default="")
	evaluator = models.ForeignKey(Person,blank=True,related_name = "evaluator")
	timestamp = models.DateTimeField()
	listens = models.IntegerField(default=0)
	RT = models.IntegerField(default=0)
	good = models.BooleanField(default=False)
	superbad = models.BooleanField(default=False)
	flagged = models.BooleanField(default=False)
	completed = models.BooleanField(default=False)

class OrthographicTranscription(models.Model):
	def __unicode__(self):
		return str(self.chunk.trial.experimental_trial_id) + u"-chunk" + str(self.chunk.pk) + u" " + str(self.orthographic_transcription)
	chunk = models.ForeignKey(Chunk, related_name = "chunk")
	outcome = models.CharField(max_length=10, blank=True, null=True)
	new_chunk = models.ForeignKey(Chunk, blank=True,null=True, related_name = "new_chunk_transcription")
	evaluator = models.ForeignKey(Person,blank=True)
	timestamp = models.DateTimeField()
	listens = models.IntegerField(default=0)
	RT = models.IntegerField(default=0)
	orthographic_transcription = models.CharField(max_length=1000, blank=True, null=True)