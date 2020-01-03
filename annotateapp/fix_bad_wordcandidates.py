from annotateapp.models import *
from django.core.exceptions import ObjectDoesNotExist
revised_word_candidates = WordCandidate.objects.filter(creation_mode = "expert")

print len(revised_word_candidates)

for wc in revised_word_candidates:
	try:
		retrimming = Retrimming.objects.get(result=wc)
		print wc.offset
		print retrimming.previous.onset
		print retrimming.previous.onset + (wc.offset - retrimming.previous.offset)
		wc.offset = retrimming.previous.onset + (wc.offset - retrimming.previous.offset)
		wc.save()
		print "----"
	except ObjectDoesNotExist:
		print "DoesNotExist"
