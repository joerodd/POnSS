from django import forms
from models import Project, Person


class PrepareTrialsUploadForm(forms.Form):
    files_field = forms.FileField(required=True,widget=forms.ClearableFileInput(attrs={'multiple': True}))
    experimental_condition = forms.CharField(required=False)
    project = forms.ChoiceField(choices=[(project.pk, project) for project in Project.objects.all()])
    experimenter = forms.ChoiceField(
        choices=[(experimenter.pk, experimenter) for experimenter in Person.objects.all() if experimenter.kind.name == "experimenter"])
    partipant_mpi_pp_code = forms.CharField(required=True)
    partipant_experimental_pp_code = forms.CharField(required=True)
    partipant_sex = forms.ChoiceField(choices=[("female","female"),("male","male"),("unknown","unknown")],required=True)
    partipant_date_of_birth = forms.DateField(required=True)
    do_chunking = forms.BooleanField()

class PrepareTrialsNetworkForm(forms.Form):
    # rsync is like this:
    #rsync - v -a --chmod=777 testing_switches_ppn_data/ /srv/www/pol-annotate/network_transfer_folder/
    directory = forms.CharField(required=True,
                                       initial="/srv/www/pol-annotate/media/corpora/switch_corpus/cleaned_ppn_045/")
    pattern_to_match = forms.CharField(required=True,initial="*_test_*.wav")
    experimental_condition = forms.CharField(required=False)
    project = forms.ChoiceField(choices=[(project.pk, project) for project in Project.objects.all()])
    experimenter = forms.ChoiceField(
        choices=[(experimenter.pk, experimenter) for experimenter in Person.objects.all() if experimenter.kind.name == "experimenter"])
    partipant_mpi_pp_code = forms.CharField(required=True)
    partipant_experimental_pp_code = forms.CharField(required=True)
    partipant_sex = forms.ChoiceField(choices=[("female","female"),("male","male"),("unknown","unknown")],required=True)
    partipant_date_of_birth = forms.DateField(required=True)
    do_chunking = forms.BooleanField()