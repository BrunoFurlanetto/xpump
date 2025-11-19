from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F

from workouts.models import WorkoutCheckin
from nutrition.models import Meal
from .models import Post, PostLike, Comment, CommentLike


# ---------------------------------- WorkoutCheckin Signals ---------------------------------- #
@receiver(post_save, sender=WorkoutCheckin)
def create_post_from_workout_checkin(sender, instance, created, **kwargs):
    """
    Create a post when a new WorkoutCheckin is saved.
    """
    if created:
        Post.objects.create(
            user=instance.user,
            content_type='workout',
            workout_checkin=instance,
            visibility='global',
            allow_comments=True
        )


@receiver(post_delete, sender=WorkoutCheckin)
def delete_post_from_workout_checkin(sender, instance, **kwargs):
    """
    Delete the associated post when a WorkoutCheckin is deleted.
    """
    Post.objects.filter(workout_checkin=instance).delete()


# ---------------------------------- Meal Signals ---------------------------------- #
@receiver(post_save, sender=Meal)
def create_post_from_meal(sender, instance, created, **kwargs):
    """
    Create a post when a new Meal is saved.
    """
    if created:
        Post.objects.create(
            user=instance.user,
            content_type='meal',
            meal=instance,
            visibility='global',
            allow_comments=True
        )


@receiver(post_delete, sender=Meal)
def delete_post_from_meal(sender, instance, **kwargs):
    """
    Delete the associated post when a Meal is deleted.
    """
    Post.objects.filter(meal=instance).delete()


# ---------------------------------- PostLike Signals ---------------------------------- #
@receiver(post_save, sender=PostLike)
def increment_post_likes_count(sender, instance, created, **kwargs):
    """
    Increment the likes_count when a new PostLike is created.
    """
    if created:
        Post.objects.filter(id=instance.post_id).update(likes_count=F('likes_count') + 1)


@receiver(post_delete, sender=PostLike)
def decrement_post_likes_count(sender, instance, **kwargs):
    """
    Decrement the likes_count when a PostLike is deleted.
    """
    Post.objects.filter(id=instance.post_id).update(likes_count=F('likes_count') - 1)


# ---------------------------------- Comment Signals ---------------------------------- #
@receiver(post_save, sender=Comment)
def increment_post_comments_count(sender, instance, created, **kwargs):
    """
    Increment the comments_count when a new Comment is created.
    """
    if created:
        Post.objects.filter(id=instance.post_id).update(comments_count=F('comments_count') + 1)


@receiver(post_delete, sender=Comment)
def decrement_post_comments_count(sender, instance, **kwargs):
    """
    Decrement the comments_count when a Comment is deleted.
    """
    Post.objects.filter(id=instance.post_id).update(comments_count=F('comments_count') - 1)


# ---------------------------------- CommentLike Signals ---------------------------------- #
@receiver(post_save, sender=CommentLike)
def increment_comment_likes_count(sender, instance, created, **kwargs):
    """
    Increment the likes_count when a new CommentLike is created.
    """
    if created:
        Comment.objects.filter(id=instance.comment_id).update(likes_count=F('likes_count') + 1)


@receiver(post_delete, sender=CommentLike)
def decrement_comment_likes_count(sender, instance, **kwargs):
    """
    Decrement the likes_count when a CommentLike is deleted.
    """
    Comment.objects.filter(id=instance.comment_id).update(likes_count=F('likes_count') - 1)


