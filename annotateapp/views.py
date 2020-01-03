from django.conf import settings
# from django.contrib.auth.models import User
from annotateapp.models import *
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import wave, datetime, time
import simplejson
import os
import glob
import shutil
from pydub import AudioSegment
from pydub.silence import split_on_silence, detect_nonsilent
from django.template import RequestContext, Template, Context
from django.core.cache import cache

# from django.contrib.auth import login, authenticate, logout
from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import render_to_response, render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
# from django.template import Context
# from decimal import Decimal
from django.views.decorators.csrf import csrf_exempt
# from django.core import serializers
# from django.db.models import Q
# import glob, csv, random, datetime, json
# from dateutil import tz
import signal

def handler(signum, frame):
   print "Forever is over!"
   raise Exception("end of time")

# Create your views here.

# @staff_member_required
# def insert_trials(request):


def show_list_of_current_wordcandidates(request):
	data = [{"wc_id":wc.pk,
			 "wc_label": wc.label,
			 "wc_is_current": wc.is_current(),
			 "wc_is_in_open_project": wc.trial.session.project.open} for wc in WordCandidate.objects.all()]
	return HttpResponse(
		simplejson.dumps(data, use_decimal=True),
		content_type="application/json"
	)

def count_current_wordcandidates(request):
	data = {"count":WordCandidate.objects.count_current()}
	return HttpResponse(
		simplejson.dumps(data, use_decimal=True),
		content_type="application/json"
	)

def count_current_trials(request):
	trials = [(obj.pk, obj.is_current()) for obj in Trial.objects.all()]
	current_trials = [obj for (obj,current) in trials if current]
	data = {"count":len(current_trials),
			"trials":trials}
	return HttpResponse(
		simplejson.dumps(data, use_decimal=True),
		content_type="application/json"
	)


def offer_trial_evaluate(request):
	times = {}
	# wait your turn!
	print("joined_queue")
	times["joined_queue"] = str(datetime.datetime.now())
	retrieve_in_progress = cache.get('retrieve_in_progress')
	print("retrieved cache")
	# if retrieve_in_progress == True:
	# 	while retrieve_in_progress:
	# 		print("stuck in looooooop")
	# 		time.sleep(3)
	# 		retrieve_in_progress = cache.get('retrieve_in_progress')
	# # wait here
	cache.set('retrieve_in_progress',True, 60)
	print("left_queue")
	times["left_queue"] = str(datetime.datetime.now())
	# word_candidate_current_count = WordCandidate.objects.count_current()
	# if word_candidate_current_count > 1:
	# 	if word_candidate_current_count > 600:
	# 		quantile = 0
	# 	else:
	# quantile = WordCandidate.objects.calculate_quantile(0.2)
	quantile = 0
	times["retrieved_quantile"] = str(datetime.datetime.now())
	print("retrieved_quantile")

	word_candidate = WordCandidate.objects.draw_random(quantile)
	word_candidate_id = word_candidate.pk
	onset = word_candidate.onset
	offset = word_candidate.offset
	times["retrieved_candidate"] = str(datetime.datetime.now())
	print("retrieved_candidate")
	if word_candidate.image == "" or word_candidate.audio == "" or word_candidate.image is None  or word_candidate.audio is None:
		times["begin_processing"] = str(datetime.datetime.now())
		print("begin_processing")
		spf = wave.open(settings.MEDIA_ROOT + "speechwavs/" + word_candidate.trial.speech_filename,'r')
		rate = spf.getframerate()
		width = spf.getsampwidth()
		total_frames = spf.getnframes()
		start = int(word_candidate.onset + word_candidate.trial.wa_origin)
		end = int(word_candidate.offset + word_candidate.trial.wa_origin)
		start_frame = int(rate * (float(start)/1000))
		end_frame = int(rate * (float(end)/1000))
		spf.setpos(start_frame)
		frames = end_frame - start_frame
		clip = spf.readframes(frames)
		if word_candidate.image == "" or word_candidate.image is None:
			before_start = start - 80
			after_end = end + 80
			before_start_frame = max(0,int(rate * (float(before_start)/1000)))
			start_frame = int(rate * (float(start)/1000))
			end_frame = int(rate * (float(end)/1000))
			after_end_frame = min(int(rate * (float(after_end)/1000)),total_frames)

			spf.setpos(before_start_frame)
			before_frames = start_frame - before_start_frame
			before_clip = spf.readframes(before_frames)
			before_signal = np.fromstring(before_clip, 'Int16')


			spf.setpos(before_start_frame)
			all_frames = after_end_frame - before_start_frame
			all_clip = spf.readframes(all_frames)
			all_signal = np.fromstring(all_clip, 'Int16')

			spf.setpos(start_frame)
			main_frames = end_frame - start_frame
			main_clip = spf.readframes(main_frames)
			main_signal = np.fromstring(main_clip, 'Int16')

			# after
			spf.setpos(end_frame)
			after_frames = after_end_frame - end_frame
			after_clip = spf.readframes(after_frames)
			after_signal = np.fromstring(after_clip, 'Int16')
			x_before = np.arange(0,len(before_signal),1)
			x_main = np.arange(len(before_signal),len(before_signal)+len(main_signal),1)
			x_after = np.arange(len(before_signal)+len(main_signal),len(before_signal)+len(main_signal)+len(after_signal),1)
			# plt.plot(x_before,before_signal,'0.85',x_main,signal,'0.15',x_after,after_signal,'0.85')
			# pic_filename = str(word_candidate.pk) + ".png"
			length = len(before_signal)+len(main_signal)+len(after_signal)

			plt.subplot(211)
			plt.plot(x_before,before_signal,'0.85',x_main,main_signal,'0.15',x_after,after_signal,'0.85')
			plt.xlim([0,length])
			plt.axis('off')
			plt.subplot(212)
			plt.specgram(all_signal, cmap='Greys')
			plt.xlim([0,length/2])
			plt.axis('off')
			pic_filename = str(word_candidate.pk) + ".png"
			plt.savefig(settings.MEDIA_ROOT + 'wavpics/' + pic_filename, bbox_inches='tight', pad_inches = 0)
			plt.close()
			word_candidate.image = pic_filename
			times["picture_made"] = str(datetime.datetime.now())
		if word_candidate.audio == "" or word_candidate.audio is None:
			snd_filename = str(word_candidate.pk) + ".wav"
			chunkAudio = wave.open(settings.MEDIA_ROOT + 'word_candidate_audio/' + snd_filename,'w')
			chunkAudio.setnchannels(1)
			chunkAudio.setsampwidth(width)
			chunkAudio.setframerate(rate)
			chunkAudio.writeframes(clip)
			chunkAudio.close()
			word_candidate.audio = snd_filename
			times["chunk_saved"] = str(datetime.datetime.now())
		word_candidate.save()
		times["done"] = str(datetime.datetime.now())

	data = {"quantile": quantile,
			"candidate_id": word_candidate.pk,
			"trial_id": word_candidate.trial.experimental_trial_id,
			"candidate_image": word_candidate.image,
			"candidate_audio": word_candidate.audio,
			"candidate_label": word_candidate.label,
			"candidate_onset": word_candidate.onset,
			"candidate_offset": word_candidate.offset,
			"times": times,
			}
	# else:
	# 	data = {"quantile": "error: no current word candidates!",
	# 			"candidate_id": "error: no current word candidates!",
	# 			"trial_id": "error: no current word candidates!",
	# 			"candidate_image": "error: no current word candidates!",
	# 			"candidate_audio": "error: no current word candidates!",
	# 			"candidate_label": "error: no current word candidates!",
	# 			"candidate_onset": "error: no current word candidates!",
	# 			"candidate_offset": "error: no current word candidates!",
	# 			"times": "error: no current word candidates!",
	# 			}
	cache.set('retrieve_in_progress', False)
	return HttpResponse(
		simplejson.dumps(data, use_decimal=True),
		content_type="application/json"
	)

def offer_trial_retrim_list(request):
	times = {}
	times["begin"] = str(datetime.datetime.now())
	if WordCandidate.objects.count_current() > 1:
		target = WordCandidate.objects.draw_random_from_list()
		word_candidate = target.word_candidate
		times["retrieved_candidate"] = str(datetime.datetime.now())
		if word_candidate.image_retrim == "" or word_candidate.audio_retrim == "" or word_candidate.image_retrim is None  or word_candidate.audio_retrim is None:
			times["begin_processing"] = str(datetime.datetime.now())
			spf = wave.open(settings.MEDIA_ROOT + "speechwavs/" + word_candidate.trial.speech_filename,'r')
			rate = spf.getframerate()
			width = spf.getsampwidth()
			total_frames = spf.getnframes()
			times["total_frames"] = total_frames
			start = int(word_candidate.onset + word_candidate.trial.wa_origin) - 320
			end = int(word_candidate.offset + word_candidate.trial.wa_origin) + 320
			start_frame = int(rate * (float(start)/1000))
			end_frame = int(rate * (float(end)/1000))
			spf.setpos(start_frame)
			frames = end_frame - start_frame
			clip = spf.readframes(frames)
			times["clipped"] = str(datetime.datetime.now())

			spf.setpos(start_frame)
			main_frames = end_frame - start_frame
			main_clip = spf.readframes(main_frames)
			main_signal = np.fromstring(main_clip, 'Int16')

			if word_candidate.image_retrim == "" or word_candidate.image_retrim is None:
				length = len(main_signal)
				x_main = np.arange(0,length,1)
				fig = plt.figure(figsize=(8,5))
				part1 = fig.add_subplot(211, axisbg='red')
				part1.get_xaxis().set_visible(False)
				part1.get_yaxis().set_visible(False)
				part1.plot(x_main,np.array(main_signal),'0.15')
				plt.xlim([0,length])
				plt.axis('off')
				part2 = fig.add_subplot(212)
				part2.specgram(main_signal, cmap='Greys')
				plt.xlim([0,length/2-1])
				plt.axis('off')
				pic_filename = str(word_candidate.pk) + ".png"
				fig.set_size_inches(8, 5)
				part2.get_xaxis().set_visible(False)
				part2.get_yaxis().set_visible(False)
				fig.tight_layout(pad=0)
				fig.savefig(settings.MEDIA_ROOT + 'wavpics_retrim/' + pic_filename, bbox_inches='tight', pad_inches = 0)
				plt.close()
				word_candidate.image_retrim = pic_filename
				times["picture_made"] = str(datetime.datetime.now())
			if word_candidate.audio_retrim == "" or word_candidate.audio_retrim is None:
				snd_filename = str(word_candidate.pk) + ".wav"
				chunkAudio = wave.open(settings.MEDIA_ROOT + 'word_candidate_audio_retrim/' + snd_filename,'w')
				chunkAudio.setnchannels(1)
				chunkAudio.setsampwidth(width)
				chunkAudio.setframerate(rate)
				chunkAudio.writeframes(clip)
				chunkAudio.close()
				word_candidate.audio_retrim = snd_filename
				times["chunk_saved"] = str(datetime.datetime.now())
			word_candidate.save()
			times["done"] = str(datetime.datetime.now())
		time.sleep(0.2)
		data = {"candidate_id": word_candidate.pk,
				"trial_id": word_candidate.trial.experimental_trial_id,
				"candidate_image": word_candidate.image_retrim,
				"candidate_audio": word_candidate.audio_retrim,
				"candidate_label": word_candidate.label,
				"candidate_onset": word_candidate.onset,
				"candidate_offset": word_candidate.offset,
				"times": times,
				}
	else:
		data = {"quantile": "error: no current word candidates!",
				"candidate_id": "error: no current word candidates!",
				"trial_id": "error: no current word candidates!",
				"candidate_image": "error: no current word candidates!",
				"candidate_audio": "error: no current word candidates!",
				"candidate_label": "error: no current word candidates!",
				"candidate_onset": "error: no current word candidates!",
				"candidate_offset": "error: no current word candidates!",
				"times": "error: no current word candidates!",
				}
	return HttpResponse(
		simplejson.dumps(data, use_decimal=True),
		content_type="application/json"
	)

def preload_retrim(request):
	context = {"evaluator": Person.objects.filter(associated_auth_user=request.user)[0].pk, }
	return render(request, 'annotateapp/loading_retrim.html', context)

def preload_errors(request):
	context = {"evaluator": Person.objects.filter(associated_auth_user=request.user)[0].pk, }
	return render(request, 'annotateapp/loading_errors.html', context)

def preload_evaluate(request):
	context = {"evaluator": Person.objects.filter(associated_auth_user=request.user)[0].pk, }
	return render(request, 'annotateapp/loading_evaluate.html', context)

def offer_trial_retrim(request):
	times = {}
	times["begin"] = str(datetime.datetime.now())
	if WordCandidate.objects.count_current() > 1:
		word_candidate = WordCandidate.objects.draw_random_retrim()
		times["retrieved_candidate"] = str(datetime.datetime.now())
		if word_candidate.image_retrim == "" or word_candidate.audio_retrim == "" or word_candidate.image_retrim is None  or word_candidate.audio_retrim is None:
			times["begin_processing"] = str(datetime.datetime.now())
			spf = wave.open(settings.MEDIA_ROOT + "speechwavs/" + word_candidate.trial.speech_filename,'r')
			rate = spf.getframerate()
			width = spf.getsampwidth()
			total_frames = spf.getnframes()
			times["total_frames"] = total_frames
			start = int(word_candidate.onset + word_candidate.trial.wa_origin) - 320
			end = int(word_candidate.offset + word_candidate.trial.wa_origin) + 320
			start_frame = int(rate * (float(start)/1000))
			end_frame = int(rate * (float(end)/1000))
			spf.setpos(start_frame)
			frames = end_frame - start_frame
			clip = spf.readframes(frames)
			times["clipped"] = str(datetime.datetime.now())

			spf.setpos(start_frame)
			main_frames = end_frame - start_frame
			main_clip = spf.readframes(main_frames)
			main_signal = np.fromstring(main_clip, 'Int16')

			if word_candidate.image_retrim == "" or word_candidate.image_retrim is None:
				length = len(main_signal)
				x_main = np.arange(0,length,1)
				fig = plt.figure(figsize=(8,5))
				part1 = fig.add_subplot(211, axisbg='red')
				part1.get_xaxis().set_visible(False)
				part1.get_yaxis().set_visible(False)
				part1.plot(x_main,np.array(main_signal),'0.15')
				plt.xlim([0,length])
				plt.axis('off')
				part2 = fig.add_subplot(212)
				part2.specgram(main_signal, cmap='Greys')
				plt.xlim([0,length/2-1])
				plt.axis('off')
				pic_filename = str(word_candidate.pk) + ".png"
				fig.set_size_inches(8, 5)
				part2.get_xaxis().set_visible(False)
				part2.get_yaxis().set_visible(False)
				fig.tight_layout(pad=0)
				fig.savefig(settings.MEDIA_ROOT + 'wavpics_retrim/' + pic_filename, bbox_inches='tight', pad_inches = 0)
				plt.close()
				word_candidate.image_retrim = pic_filename
				times["picture_made"] = str(datetime.datetime.now())
			if word_candidate.audio_retrim == "" or word_candidate.audio_retrim is None:
				snd_filename = str(word_candidate.pk) + ".wav"
				chunkAudio = wave.open(settings.MEDIA_ROOT + 'word_candidate_audio_retrim/' + snd_filename,'w')
				chunkAudio.setnchannels(1)
				chunkAudio.setsampwidth(width)
				chunkAudio.setframerate(rate)
				chunkAudio.writeframes(clip)
				chunkAudio.close()
				word_candidate.audio_retrim = snd_filename
				times["chunk_saved"] = str(datetime.datetime.now())
			word_candidate.save()
			times["done"] = str(datetime.datetime.now())
		time.sleep(0.2)
		data = {"candidate_id": word_candidate.pk,
				"trial_id": word_candidate.trial.experimental_trial_id,
				"candidate_image": word_candidate.image_retrim,
				"candidate_audio": word_candidate.audio_retrim,
				"candidate_label": word_candidate.label,
				"candidate_onset": word_candidate.onset,
				"candidate_offset": word_candidate.offset,
				"times": times,
				}
	else:
		data = {"quantile": "error: no current word candidates!",
				"candidate_id": "error: no current word candidates!",
				"trial_id": "error: no current word candidates!",
				"candidate_image": "error: no current word candidates!",
				"candidate_audio": "error: no current word candidates!",
				"candidate_label": "error: no current word candidates!",
				"candidate_onset": "error: no current word candidates!",
				"candidate_offset": "error: no current word candidates!",
				"times": "error: no current word candidates!",
				}
	return HttpResponse(
		simplejson.dumps(data, use_decimal=True),
		content_type="application/json"
	)

def check_trial_targets(request):
	trial = Trial.objects.draw_random_for_error()
	data = {"trial_id": trial.pk,
			"experimental_trial_id": trial.experimental_trial_id,
			"trial_image": trial.image,
			"trial_audio": trial.audio}
	return HttpResponse(
		simplejson.dumps(data, use_decimal=True),
		content_type="application/json"
	)

@staff_member_required
def add_new_trial_with_chunks(request):

	do_chunking = request.POST.get('do_chunking')
	experimental_trial_id = request.POST.get('experimental_trial_id')
	experimental_condition = request.POST.get('experimental_condition')
	session = RecordingSession.objects.get(pk=int(request.POST.get('session')))
	speech_filename = request.POST.get('experimental_condition')

	# if do_chunking:
		# make chunks here


from .forms import PrepareTrialsUploadForm, PrepareTrialsNetworkForm


def handle_uploaded_trial_file(f, filename):
	with open(settings.MEDIA_ROOT + filename, 'wb+') as destination:
		for chunk in f.chunks():
			destination.write(chunk)


def process_file(form,http_file=None,network_filename=None):
	file_outcome = ""
	if http_file:
		uploaded_filename = http_file.name.split(".wav")[0]
	elif network_filename:
		uploaded_filename = network_filename.split("/")[-1].split(".wav")[0]
	file_outcome = file_outcome + uploaded_filename + "<br>"
	speaker = Person.objects.get_or_create(
		kind=PersonKind.objects.get(name="speaker"),
		experimental_id=form.cleaned_data["partipant_experimental_pp_code"],
		sex=form.cleaned_data["partipant_sex"],
		date_of_birth=form.cleaned_data["partipant_date_of_birth"],
		mpi_pp_code=form.cleaned_data["partipant_mpi_pp_code"]
	)[0]
	session = RecordingSession.objects.get_or_create(
		project=Project.objects.get(pk=int(form.cleaned_data["project"])),
		experimenter=Person.objects.get(pk=int(form.cleaned_data["experimenter"])),
		speaker=speaker
		)[0]
	session.save()

	new_trial = Trial(
		experimental_trial_id=uploaded_filename,
		experimental_condition=form.cleaned_data["experimental_condition"],
		session=session,
		wa_origin=0,
		et_origin=0,
		interest_onset=0,
		interest_offset=0,
		current=True,
		image="",
		audio=""
	)
	new_trial.save()
	new_trial.speech_filename = "trialrecording_" + str(
		new_trial.pk) + "_" + new_trial.experimental_trial_id + ".wav"
	new_trial.save()
	if http_file:
		handle_uploaded_trial_file(http_file, "two_channel_speechwavs/" + new_trial.speech_filename)
		trial_audio_left = AudioSegment.from_wav(
			settings.MEDIA_ROOT + "two_channel_speechwavs/" + new_trial.speech_filename)
	elif network_filename:
		trial_audio_left = AudioSegment.from_wav(network_filename)

	if form.cleaned_data["do_chunking"]:
		file_outcome = file_outcome + "doing chunking<br>"

		def match_target_amplitude(aChunk, target_dBFS):
			''' Normalize given audio chunk '''
			change_in_dBFS = target_dBFS - aChunk.dBFS
			return aChunk.apply_gain(change_in_dBFS)

		# Load your audio.
		normalized_trial_audio = match_target_amplitude(trial_audio_left, -20.0)
		normalized_trial_audio.export(settings.MEDIA_ROOT + "speechwavs/" + new_trial.speech_filename, format="wav")

		# Split track where the silence is 2 seconds or more and get chunks using
		# the imported function.
		chunk_onsets_offsets = detect_nonsilent(
			# Use the loaded audio.
			normalized_trial_audio,
			# Specify that a silent chunk must be at least 2 seconds or 2000 ms long.
			min_silence_len=300,
			# Consider a chunk silent if it's quieter than -16 dBFS.
			# (You may want to adjust this parameter.)
			silence_thresh=-35
		)

		file_outcome = file_outcome + "there are {0} chunks".format(len(chunk_onsets_offsets)) + "<br>"
		# Process each chunk with your parameters
		for i, chunk_onsets_offset in enumerate(chunk_onsets_offsets):
			onset_ms = max(chunk_onsets_offset[0] - 50, 0)
			offset_ms = min(chunk_onsets_offset[1] + 50, normalized_trial_audio.duration_seconds * 1000)

			new_chunk = Chunk(trial=new_trial,
							  chunk_index=i,
							  labelled=False,
							  maused=False,
							  orthographic_transcription="",
							  chunk_onset_time=onset_ms,
							  chunk_offset_time=offset_ms
							  )
			new_chunk.save()

			chunk = normalized_trial_audio[onset_ms:offset_ms].fade_in(10).fade_out(10)

			# Normalize the entire chunk.
			normalized_chunk = match_target_amplitude(chunk, -20.0)

			# Export the audio chunk with new bitrate.
			chunk_filename = "chunkrecording_" + \
							 str(new_chunk.pk) + "_" + new_trial.experimental_trial_id + \
							 "_chunk" + str(i) + ".wav"
			file_outcome = file_outcome + "Exporting chunk {0}".format(i) + " to " + chunk_filename + "<br>"
			normalized_chunk.export(settings.MEDIA_ROOT + "chunkrecordings/" + chunk_filename, format="wav")
			new_chunk.audio = chunk_filename
			new_chunk.save()
	file_outcome = file_outcome + "<br>"
	return file_outcome

@staff_member_required
def make_chunk_audios_for_new_chunks(request):
	file_outcome = ""

	def match_target_amplitude(aChunk, target_dBFS):
		''' Normalize given audio chunk '''
		change_in_dBFS = target_dBFS - aChunk.dBFS
		return aChunk.apply_gain(change_in_dBFS)

	for chunk in Chunk.objects.filter(audio=""):
		trial_audio_filename = settings.MEDIA_ROOT + "speechwavs/" + chunk.trial.speech_filename
		normalized_trial_audio = AudioSegment.from_wav(trial_audio_filename)

		chunk_audio = normalized_trial_audio[float(chunk.chunk_onset_time):float(chunk.chunk_offset_time)].fade_in(10).fade_out(10)

		# Normalize the entire chunk.
		normalized_chunk = match_target_amplitude(chunk_audio, -20.0)

		# Export the audio chunk with new bitrate.
		chunk_filename = "chunkrecording_" + \
						 str(chunk.pk) + "_" + chunk.trial.experimental_trial_id + \
						 "_chunk" + str(chunk.chunk_index) + ".wav"
		file_outcome = file_outcome + "Exporting chunk {0}".format(chunk.chunk_index) + " to " + chunk_filename + "<br>"
		normalized_chunk.export(settings.MEDIA_ROOT + "chunkrecordings/" + chunk_filename, format="wav")
		chunk.audio = chunk_filename
		chunk.save()
		# os.system("pip install --user pydub")
		outcome = ""

	file_outcome = file_outcome + "<br>"
	return file_outcome

@staff_member_required
def upload_trials(request):
	# os.system("pip install --user pydub")
	outcome = ""

	if request.method == 'POST':
		form = PrepareTrialsUploadForm(request.POST, request.FILES)
		if form.is_valid():
			files = request.FILES.getlist('files_field')

			outcome = outcome + "There are " + str(len(files)) + " files.<br>"
			for file in files:
				outcome = outcome + process_file(form,http_file=file)


		return HttpResponse(outcome)
	else:
		form = PrepareTrialsUploadForm()
	return render(request, 'annotateapp/upload_trial.html', {'form': form})

@staff_member_required
def process_network_trials(request):
	# os.system("pip install --user pydub")
	outcome = ""

	if request.method == 'POST':
		form = PrepareTrialsNetworkForm(request.POST)
		if form.is_valid():

			unreadable_dirs = []
			unreadable_files = []
			directory = form.cleaned_data["directory"]
			pattern = form.cleaned_data["pattern_to_match"]
			files = glob.glob(directory + pattern)
			outcome = outcome + directory + pattern + "<br>"
			outcome = outcome + str(files) + "<br>"
			# outcome = outcome + 'Unreadable directories:\n{0}'.format('\n'.join(unreadable_dirs)) + "<br>"
			# outcome = outcome + 'Unreadable files:\n{0}'.format('\n'.join(unreadable_files)) + "<br>"

			for file in files:
				outcome = outcome + process_file(form,network_filename=file)

		return HttpResponse(outcome)
	else:
		form = PrepareTrialsNetworkForm()
	return render(request, 'annotateapp/upload_trial.html', {'form': form})



def offer_trial_ortho(request):
	times = {}
	times["begin"] = str(datetime.datetime.now())
	# try:
	chunk = Chunk.objects.draw_random()
	times["retrieved_orthographic"] = str(datetime.datetime.now())
	if chunk.image == "" or chunk.image is None:
		# bother to do processing at all
		times["begin_processing"] = str(datetime.datetime.now())
		spf = wave.open(settings.MEDIA_ROOT + "chunkrecordings/" + chunk.audio,'r')
		rate = spf.getframerate()
		width = spf.getsampwidth()
		total_frames = spf.getnframes()
		times["total_frames"] = total_frames
		start = int(0)
		start_frame = int(rate * (float(start)/1000))
		end_frame = total_frames
		spf.setpos(start_frame)
		frames = end_frame - start_frame
		clip = spf.readframes(frames)
		times["clipped"] = str(datetime.datetime.now())

		spf.setpos(start_frame)
		main_frames = end_frame - start_frame
		main_clip = spf.readframes(main_frames)
		main_signal = np.fromstring(main_clip, 'Int16')

		if chunk.image == "" or chunk.image is None:
			# only make an image if there isn't one
			length = len(main_signal)
			x_main = np.arange(0,length,1)
			fig = plt.figure(figsize=(8,5))
			part1 = fig.add_subplot(211, axisbg='red')
			part1.get_xaxis().set_visible(False)
			part1.get_yaxis().set_visible(False)
			part1.plot(x_main,np.array(main_signal),'0.15')
			plt.xlim([0,length])
			plt.axis('off')
			# part2 = fig.add_subplot(212)
			# part2.specgram(main_signal, cmap='Greys')
			# plt.xlim([0,length/2-1])
			# plt.axis('off')
			pic_filename = str(chunk.pk) + ".png"
			fig.set_size_inches(11.2, 7)
			# part2.get_xaxis().set_visible(False)
			# part2.get_yaxis().set_visible(False)
			fig.tight_layout(pad=0)
			fig.savefig(settings.MEDIA_ROOT + 'chunkpics/' + pic_filename, bbox_inches='tight', pad_inches = 0)
			plt.close()
			chunk.image = pic_filename
			times["picture_made"] = str(datetime.datetime.now())
	chunk.save()
	# time.sleep(0.2)
	times["done"] = str(datetime.datetime.now())

	data = {"chunk_id": chunk.pk,
			"experimental_trial_id": chunk.trial.experimental_trial_id,
			"vocabulary": chunk.trial.session.project.vocabulary,
			"chunk_image": chunk.image,
			"chunk_audio": chunk.audio,
			"times": times
			}

	# except Exception, exc:
	# 	data = {"chunk_id": exc,
	# 			"experimental_trial_id": exc,
	# 			"vocabulary": exc,
	# 			"chunk_image": exc,
	# 			"chunk_audio": exc,
	# 			"times": exc
	# 			}

	return HttpResponse(
			simplejson.dumps(data, use_decimal=True),
			content_type="application/json"
		)


def offer_trial_errors(request):
	times = {}
	times["begin"] = str(datetime.datetime.now())
	try:
		trial = Trial.objects.draw_random_for_error()
		times["retrieved_error"] = str(datetime.datetime.now())
		if trial.image == "" or trial.audio == "" or trial.image is None or trial.audio is None:
			# bother to do processing at all
			times["begin_processing"] = str(datetime.datetime.now())
			spf = wave.open(settings.MEDIA_ROOT + "speechwavs/" + trial.speech_filename,'r')
			rate = spf.getframerate()
			width = spf.getsampwidth()
			total_frames = spf.getnframes()
			times["total_frames"] = total_frames
			start = int(trial.interest_onset+trial.wa_origin)
			# end = int(trial.interest_offset+trial.wa_origin)
			start_frame = int(rate * (float(start)/1000))
			# end_frame = int(rate * (float(end)/1000))
			end_frame = total_frames
			spf.setpos(start_frame)
			frames = end_frame - start_frame
			clip = spf.readframes(frames)
			times["clipped"] = str(datetime.datetime.now())

			spf.setpos(start_frame)
			main_frames = end_frame - start_frame
			main_clip = spf.readframes(main_frames)
			main_signal = np.fromstring(main_clip, 'Int16')

			if trial.image == "" or trial.image is None:
				# only make an image if there isn't one
				length = len(main_signal)
				x_main = np.arange(0,length,1)
				fig = plt.figure(figsize=(8,5))
				part1 = fig.add_subplot(211, axisbg='red')
				part1.get_xaxis().set_visible(False)
				part1.get_yaxis().set_visible(False)
				part1.plot(x_main,np.array(main_signal),'0.15')
				plt.xlim([0,length])
				plt.axis('off')
				# part2 = fig.add_subplot(212)
				# part2.specgram(main_signal, cmap='Greys')
				# plt.xlim([0,length/2-1])
				# plt.axis('off')
				pic_filename = str(trial.pk) + ".png"
				fig.set_size_inches(8, 5)
				# part2.get_xaxis().set_visible(False)
				# part2.get_yaxis().set_visible(False)
				fig.tight_layout(pad=0)
				fig.savefig(settings.MEDIA_ROOT + 'trialpics/' + pic_filename, bbox_inches='tight', pad_inches = 0)
				plt.close()
				trial.image = pic_filename
				times["picture_made"] = str(datetime.datetime.now())
			if trial.audio == "" or trial.audio is None:
				# only make auido if there isn't any
				snd_filename = str(trial.pk) + ".wav"
				chunkAudio = wave.open(settings.MEDIA_ROOT + 'trialwavs/' + snd_filename,'w')
				chunkAudio.setnchannels(1)
				chunkAudio.setsampwidth(width)
				chunkAudio.setframerate(rate)
				chunkAudio.writeframes(clip)
				chunkAudio.close()
				trial.audio = snd_filename
				times["chunk_saved"] = str(datetime.datetime.now())
		trial.save()
		# time.sleep(0.2)
		times["done"] = str(datetime.datetime.now())
		trial_details = TrialDetails.objects.get(trial=trial)
		data = {"trial_id": trial.pk,
				"experimental_trial_id": trial.experimental_trial_id,
				"trial_image": trial.image,
				"trial_audio": trial.audio,
				"times": times,
				"trial_onset": trial.interest_onset,
				"trial_offset": trial.interest_offset,
				"f1": trial_details.f1,
				"t2": trial_details.t2,
				"t3": trial_details.t3,
				"t4": trial_details.t4,
				"t5": trial_details.t5,
				"t6": trial_details.t6,
				"f7": trial_details.f7,
				"f8": trial_details.f8
				}

	except Exception, exc:
		data = {"trial_id": exc,
				"experimental_trial_id": exc,
				"trial_image": exc,
				"trial_audio": exc,
				"times": exc,
				"f1": exc,
				"t2": exc,
				"t3": exc,
				"t4": exc,
				"t5": exc,
				"t6": exc,
				"f7": exc,
				"f8": exc}

	return HttpResponse(
			simplejson.dumps(data, use_decimal=True),
			content_type="application/json"
		)

def offer_picture(request):
	times = {}
	times["begin"] = str(datetime.datetime.now())
	word_candidate = WordCandidate.objects.draw_random_retrim()
	times["retrieved_candidate"] = str(datetime.datetime.now())
	times["begin_processing"] = str(datetime.datetime.now())
	spf = wave.open(settings.MEDIA_ROOT + "speechwavs/" + word_candidate.trial.speech_filename,'r')
	rate = spf.getframerate()
	width = spf.getsampwidth()
	total_frames = spf.getnframes()
	times["total_frames"] = total_frames
	start = int(word_candidate.onset + word_candidate.trial.wa_origin) - 320
	end = int(word_candidate.offset + word_candidate.trial.wa_origin) + 320
	start_frame = int(rate * (float(start)/1000))
	end_frame = int(rate * (float(end)/1000))
	spf.setpos(start_frame)
	frames = end_frame - start_frame
	clip = spf.readframes(frames)
	times["clipped"] = str(datetime.datetime.now())
	spf.setpos(start_frame)
	main_frames = end_frame - start_frame
	main_clip = spf.readframes(main_frames)
	main_signal = np.fromstring(main_clip, 'Int16')
	length = len(main_signal)
	x_main = np.arange(0,length,1)
	fig = plt.figure(figsize=(8,5))
	part1 = fig.add_subplot(211, axisbg='red')
	part1.get_xaxis().set_visible(False)
	part1.get_yaxis().set_visible(False)
	part1.plot(x_main,np.array(main_signal),'0.15')
	plt.xlim([0,length])
	plt.axis('off')
	part2 = fig.add_subplot(212)
	part2.specgram(main_signal, cmap='Greys')
	plt.xlim([0,length/2-1])
	plt.axis('off')
	pic_filename = str(word_candidate.pk) + ".png"
	fig.set_size_inches(8, 5)
	part2.get_xaxis().set_visible(False)
	part2.get_yaxis().set_visible(False)
	fig.tight_layout(pad=0)
	fig.savefig(settings.MEDIA_ROOT + 'wavpics_retrim/' + pic_filename, bbox_inches='tight', pad_inches = 0)
	plt.close()
	word_candidate.image = pic_filename
	times["picture_made"] = str(datetime.datetime.now())

	html = Template('<img src="/media/wavpics_retrim/' + pic_filename + '"/>')
	ctx = { 'STATIC_URL':settings.STATIC_URL}
	return HttpResponse(html.render(Context(ctx)))

@staff_member_required
def calculate_current_and_rating(request):
	for proj in Project.objects.all():
		if proj.open:
			for word_candidate in WordCandidate.objects.filter(trial__session__project=proj):
				word_candidate.is_current()
				word_candidate.current_rating()
				word_candidate.evaluation_count()
			for trial in Trial.objects.filter(session__project=proj):
				trial.is_current()
		else:
			for word_candidate in WordCandidate.objects.filter(trial__session__project=proj):
				word_candidate.current = False
				word_candidate.save()
			for trial in Trial.objects.filter(session__project=proj):
				trial.current = False
				trial.save()
			for chunk in Chunk.objects.filter(trial__session__project=proj):
				chunk.current = False
				chunk.save()

	word_candidate_list = []

@staff_member_required
def correct_superbad_bug(request):
	data = []
	for ortho in OrthographicTranscription.objects.filter(orthographic_transcription="",outcome="superbad"):
		chunk = ortho.chunk
		chunk.labelled = False
		chunk.rejected = False
		chunk.save()
		ortho.delete()
		data.append(chunk.__unicode__())
	return HttpResponse(
		simplejson.dumps(data, use_decimal=True),
		content_type="application/json"
	)

@staff_member_required
def make_hesitations(request):
	data = []
	for chunk in Chunk.objects.filter(labelled=True,current=True).exclude(maus="",rejected=True,replaced=True):
		if chunk.maus != "":
			chunk.make_hesitations()
			data.append(chunk.__unicode__())
	return HttpResponse(
		simplejson.dumps(data, use_decimal=True),
		content_type="application/json"
	)

@staff_member_required
def prepare_resources(request):
	word_candidate_list = []
	for word_candidate in WordCandidate.objects.all():
		if (word_candidate.image == "" or word_candidate.audio == "" or word_candidate.image is None  or word_candidate.audio is None) and word_candidate.word_class != "filler":
			word_candidate_list.append(word_candidate.pk)
			spf = wave.open(settings.MEDIA_ROOT + "speechwavs/" + word_candidate.trial.speech_filename,'r')
			rate = spf.getframerate()
			width = spf.getsampwidth()
			total_frames = spf.getnframes()
			start = int(word_candidate.onset + word_candidate.trial.wa_origin)
			end = int(word_candidate.offset + word_candidate.trial.wa_origin)
			start_frame = int(rate * (float(start)/1000))
			end_frame = int(rate * (float(end)/1000))
			spf.setpos(start_frame)
			frames = end_frame - start_frame
			clip = spf.readframes(frames)
			if word_candidate.image == "" or word_candidate.image is None:
				signal = np.fromstring(clip, 'Int16')
				# before
				start = int(word_candidate.onset + word_candidate.trial.wa_origin) - 80
				end = int(word_candidate.onset + word_candidate.trial.wa_origin)
				start_frame = int(rate * (float(start)/1000))
				end_frame = int(rate * (float(end)/1000))
				spf.setpos(start_frame)
				frames = end_frame - start_frame
				before_clip = spf.readframes(frames)
				before_signal = np.fromstring(before_clip, 'Int16')
				# after
				start = int(word_candidate.offset + word_candidate.trial.wa_origin)
				end = int(word_candidate.offset + word_candidate.trial.wa_origin) + 80
				start_frame = int(rate * (float(start)/1000))
				end_frame = int(rate * (float(end)/1000))
				spf.setpos(start_frame)
				frames = end_frame - start_frame
				after_clip = spf.readframes(frames)
				after_signal = np.fromstring(after_clip, 'Int16')
				x_before = np.arange(0,len(before_signal),1)
				x_main = np.arange(len(before_signal),len(before_signal)+len(signal),1)
				x_after = np.arange(len(before_signal)+len(signal),len(before_signal)+len(signal)+len(after_signal),1)
				plt.plot(x_before,before_signal,'0.85',x_main,signal,'0.15',x_after,after_signal,'0.85')
				pic_filename = str(word_candidate.pk) + ".png"
				plt.axis('off')
				plt.savefig(settings.MEDIA_ROOT + 'wavpics/' + pic_filename, bbox_inches='tight', pad_inches = 0)
				plt.close()
				word_candidate.image = pic_filename
			if word_candidate.audio == "" or word_candidate.audio is None:
				snd_filename = str(word_candidate.pk) + ".wav"
				chunkAudio = wave.open(settings.MEDIA_ROOT + 'word_candidate_audio/' + snd_filename,'w')
				chunkAudio.setnchannels(1)
				chunkAudio.setsampwidth(width)
				chunkAudio.setframerate(rate)
				chunkAudio.writeframes(clip)
				chunkAudio.close()
				word_candidate.audio = snd_filename
			word_candidate.save()

	data = {"candidates": word_candidate_list
			}
	return HttpResponse(
		simplejson.dumps(data, use_decimal=True),
		content_type="application/json"
	)

@login_required
def evaluate(request):
	context = {"evaluator": Person.objects.filter(associated_auth_user = request.user)[0].pk,}
	return render(request, 'annotateapp/evaluate.html', context)

@login_required
def evaluate_practice(request):
	context = {"evaluator": Person.objects.filter(associated_auth_user = request.user)[0].pk,}
	return render(request, 'annotateapp/evaluate_practice.html', context)

@login_required
def retrim(request):
	context = {"evaluator": Person.objects.filter(associated_auth_user = request.user)[0].pk,}
	return render(request, 'annotateapp/retrim.html', context)

@login_required
def errors(request):
	context = {"evaluator": Person.objects.filter(associated_auth_user = request.user)[0].pk,}
	return render(request, 'annotateapp/errors.html', context)

@login_required
def ortho(request):
	context = {"evaluator": Person.objects.filter(associated_auth_user = request.user)[0].pk,}
	return render(request, 'annotateapp/ortho.html', context)

@login_required
def retrim_list(request):
	context = {"evaluator": Person.objects.filter(associated_auth_user = request.user)[0].pk,}
	return render(request, 'annotateapp/retrim_list.html', context)

@login_required
def retrim_practice(request):
	context = {"evaluator": Person.objects.filter(associated_auth_user = request.user)[0].pk,}
	return render(request, 'annotateapp/retrim_practice.html', context)

@login_required
def evaluate_homepage(request):
	context = {'still_to_evaluate': len(WordCandidate.objects.filter(rejected=False, word_class="experimental",current=True, evaluations__lte=0).exclude(creation_mode="expert")),
			   'still_to_retrim': len(WordCandidate.objects.filter(rejected=False, word_class="experimental", evaluations__gte = 1, rating__lte=0.5,
							   current=True)),
			   'still_to_ortho': len(Chunk.objects.filter(labelled=False, rejected=False, replaced=False, current=True)),
			   'still_to_error':len(Trial.objects.filter(current=True)),
	}
	return render(request, 'annotateapp/homepage.html', context)

@csrf_exempt
@login_required
def accept_result_ortho(request):
	accepted = request.POST.get('accepted')
	chunk = Chunk.objects.get(pk = int(request.POST.get('chunk_id')))
	if not chunk.labelled:

		if accepted == "good":
			chunk.orthographic_transcription = request.POST.get('orthographic_transcription')
			chunk.labelled = True
		if accepted == "flag":

			def match_target_amplitude(aChunk, target_dBFS):
				''' Normalize given audio chunk '''
				change_in_dBFS = target_dBFS - aChunk.dBFS
				return aChunk.apply_gain(change_in_dBFS)

			chunk.orthographic_transcription = request.POST.get('orthographic_transcription')
			chunk.labelled = True
			chunk.replaced = True
			chunk.rejected = True
			new_chunk = Chunk(trial = chunk.trial,
							  chunk_index = chunk.chunk_index,
							  chunk_offset_time = chunk.chunk_offset_time + 200,
							  chunk_onset_time=chunk.chunk_onset_time - 200)

			trial_audio_filename = settings.MEDIA_ROOT + "speechwavs/" + new_chunk.trial.speech_filename
			normalized_trial_audio = AudioSegment.from_wav(trial_audio_filename)

			new_chunk_audio = normalized_trial_audio[float(new_chunk.chunk_onset_time):float(new_chunk.chunk_offset_time)].fade_in(
				10).fade_out(10)

			# Normalize the entire chunk.
			normalized_chunk = match_target_amplitude(new_chunk_audio, -20.0)

			# Export the audio chunk with new bitrate.
			chunk_filename = "chunkrecording_" + \
							 str(new_chunk.pk) + "_" + new_chunk.trial.experimental_trial_id + \
							 "_chunk" + str(new_chunk.chunk_index) + ".wav"
			normalized_chunk.export(settings.MEDIA_ROOT + "chunkrecordings/" + chunk_filename, format="wav")
			new_chunk.audio = chunk_filename


			new_chunk.save()
			chunk.new_chunk = new_chunk

		elif accepted == "superbad":
			chunk.orthographic_transcription = ""
			chunk.labelled = True
			chunk.rejected = True
		chunk.save()
		chunk.is_current()
		new_transcription = OrthographicTranscription(
			chunk = chunk,
			outcome = accepted,
			evaluator = Person.objects.get(pk=int(request.POST.get('evaluator'))),
			timestamp = datetime.datetime.fromtimestamp(int(request.POST.get('timestamp'))/1000.0),
			listens = int(request.POST.get('listens')),
			RT = int(request.POST.get('RT')),
			orthographic_transcription = chunk.orthographic_transcription
			)
		if accepted == "flag":
			new_transcription.new_chunk = new_chunk
		new_transcription.save()
		if accepted == "good" and chunk.orthographic_transcription != "":
			chunk.do_maus()
			chunk.make_wcs()
			chunk.make_hesitations()

		return HttpResponse(
			simplejson.dumps("Python says success: accept_result_ortho"),
			content_type="application/json"
		)
	else:
		return HttpResponse(
			simplejson.dumps("Python says success: accept_result_ortho, but this chunk was already labelled so did nothing"),
			content_type="application/json"
		)




@csrf_exempt
@login_required
def accept_result_evaluate(request):
	accepted = request.POST.get('good')
	wc = WordCandidate.objects.get(pk = int(request.POST.get('word_candidate')))
	# wc.number_of_evaluations = wc.number_of_evaluations + 1
	good = False
	superbad = False
	if accepted == "good":
		good = True
		flagged = False
		superbad = False
	elif accepted == "bad":
		good = False
		flagged = False
		superbad = False
	if accepted == "superbad":
		good = False
		superbad = True
		flagged = False
		wc.rejected = True
		wc.save()
	if accepted == "flag":
		good = False
		flagged = True
		superbad = False
		wc.rejected = True
		wc.save()
	new_evaluation = Evaluation(
		word_candidate = wc,
		evaluator = Person.objects.get(pk=int(request.POST.get('evaluator'))),
		timestamp = datetime.datetime.fromtimestamp(int(request.POST.get('timestamp'))/1000.0),
		listens = int(request.POST.get('listens')),
		RT = int(request.POST.get('RT')),
		good = good,
		superbad = superbad,
		flagged = flagged,
		completed = True)
	new_evaluation.save()
	wc.is_current()
	wc.current_rating()
	wc.evaluation_count()
	return HttpResponse(
		simplejson.dumps("Python says success: accept_result_evaluate"),
		content_type="application/json"
	)

@csrf_exempt
@login_required
def accept_result_retrim(request):
	accepted = request.POST.get('good')
	old_wc = WordCandidate.objects.get(pk = int(request.POST.get('word_candidate')))
	onset_difference = int(round(float(request.POST.get('left_cursor'))))-320
	offset_difference = int(round(float(request.POST.get('right_cursor'))))-320
	new_wc = WordCandidate(
		trial = old_wc.trial,
		label = old_wc.label,
		onset = old_wc.onset + onset_difference,
		offset = old_wc.onset + offset_difference,
		creation_mode = "expert",
		word_class = old_wc.word_class,
		)
	new_wc.save()
	new_retrimming = Retrimming(
		previous = old_wc,
		result = new_wc,
		evaluator = Person.objects.get(pk=int(request.POST.get('evaluator'))),
		timestamp = datetime.datetime.fromtimestamp(int(request.POST.get('timestamp'))/1000.0),
		listens = int(request.POST.get('listens')),
		RT = int(request.POST.get('RT')))
	new_retrimming.save()

	old_wc.is_current()
	old_wc.current_rating()
	old_wc.evaluation_count()

	new_wc.is_current()
	new_wc.current_rating()
	new_wc.evaluation_count()

	return HttpResponse(
		simplejson.dumps("Python says success: accept_result_retrim"),
		content_type="application/json"
	)

@csrf_exempt
@login_required
def accept_result_errors(request):
	accepted = request.POST.get('good')
	trial = Trial.objects.get(pk = int(request.POST.get('trial_id')))
	new_trial_details_corrected = TrialDetailsCorrected(
		trial = trial,
		evaluator=Person.objects.get(pk=int(request.POST.get('evaluator'))),
		timestamp=datetime.datetime.fromtimestamp(int(request.POST.get('timestamp')) / 1000.0),
		listens=int(request.POST.get('listens')),
		RT=int(request.POST.get('RT')),
		f1 = request.POST.get('new_f1'),
		t2 = request.POST.get('new_t2'),
		t3 = request.POST.get('new_t3'),
		t4 = request.POST.get('new_t4'),
		t5 = request.POST.get('new_t5'),
		t6 = request.POST.get('new_t6'),
		f7 = request.POST.get('new_f7'),
		f8 = request.POST.get('new_f8'))
	new_trial_details_corrected.save()

	trial.is_current()

	return HttpResponse(
		simplejson.dumps("Python says success: accept_result_errors"),
		content_type="application/json"
	)

@csrf_exempt
@login_required
def accept_result_retrim_list(request):
	accepted = request.POST.get('good')
	old_wc = WordCandidate.objects.get(pk = int(request.POST.get('word_candidate')))
	onset_difference = int(round(float(request.POST.get('left_cursor'))))-320
	offset_difference = int(round(float(request.POST.get('right_cursor'))))-320
	new_wc = WordCandidate(
		trial = old_wc.trial,
		label = old_wc.label,
		onset = old_wc.onset + onset_difference,
		offset = old_wc.onset + offset_difference,
		creation_mode = "expert",
		word_class = old_wc.word_class,
		)
	new_wc.save()
	list_member = WordCandidateToBeChecked.objects.get(word_candidate = old_wc)
	list_member.done = list_member.done + 1
	list_member.save()
	new_retrimming = RetrimmingList(
		previous = old_wc,
		result = new_wc,
		evaluator = Person.objects.get(pk=int(request.POST.get('evaluator'))),
		timestamp = datetime.datetime.fromtimestamp(int(request.POST.get('timestamp'))/1000.0),
		listens = int(request.POST.get('listens')),
		RT = int(request.POST.get('RT')))
	new_retrimming.save()
	return HttpResponse(
		simplejson.dumps("Python says success: accept_result_retrim"),
		content_type="application/json"
	)

@csrf_exempt
@login_required
def undo_last_30_seconds(request):
	t_evaluator = request.POST.get('evaluator')
	t_timestamp = datetime.datetime.fromtimestamp(int(request.POST.get('timestamp'))/1000.0)
	to_remove_evaluations = Evaluation.objects.filter(evaluator = t_evaluator, timestamp__gte = t_timestamp - datetime.timedelta(seconds=10))
	for evaluation in to_remove_evaluations:
		wc = evaluation.word_candidate
		# wc.nevaluations  = wc.nevaluations  - 1
		wc.save()
		evaluation.delete()
	return HttpResponse(
		simplejson.dumps("Python says success: undo_last_30_seconds; " + str(len(to_remove_evaluations)) + " evaluations removed."),
		content_type="application/json"
	)


@staff_member_required
def retrim_copy(request):
	for retrim_list in RetrimmingList.objects.iterator():
		new_retrimming = Retrimming(
			previous = retrim_list.previous,
			result = retrim_list.result,
			evaluator = retrim_list.evaluator,
			timestamp = retrim_list.timestamp,
			listens = retrim_list.listens,
			RT = retrim_list.RT
			)
		new_retrimming.save()
	return HttpResponse(
		simplejson.dumps(retrim_list),
		content_type="application/json"
	)

@staff_member_required
def make_trial_textgrid(request,trial_id):
	textgrid = """File type = "ooTextFile"
Object class = "TextGrid"

xmin = 0
xmax = 0.855000
tiers? <exists>
size = 3
item []:
    item [1]:
    	class = "IntervalTier"
        name = "ORT-MAU"
        xmin = 0
        xmax = 0.855000
        intervals =
"""
	for chunk in Chunk.objects.filter(trial=trial_id, labelled=True).order_by('chunk_onset_time'):
		textgrid += "chunk" + str(chunk.pk) + " " + str(chunk.chunk_index)+  " " + str(chunk.chunk_onset_time) + " - " + str(chunk.chunk_offset_time) + " " + chunk.orthographic_transcription + "\n"

	for wordcandidate in WordCandidate.objects.filter(trial=trial_id).exclude(rejected=True).order_by('onset'):
		# check there isn't a replacement:
		if Retrimming.objects.filter(previous=wordcandidate).count() == 0:
			textgrid += "wc" + str(wordcandidate.pk) + " " + wordcandidate.creation_mode + " " + str(wordcandidate.onset) + " - " + str(wordcandidate.offset) + " " + wordcandidate.label + " evals: " + str(wordcandidate.evaluations) + " rating: " + str(wordcandidate.rating) + "\n"
		else:
			textgrid += "[wc" + str(wordcandidate.pk) + " " + wordcandidate.creation_mode + " " + str(
				wordcandidate.onset) + " - " + str(wordcandidate.offset) + " " + wordcandidate.label + " evals: " + str(
				wordcandidate.evaluations) + " rating: " + str(wordcandidate.rating) + "]\n"
	return HttpResponse(textgrid,content_type="text/plain")