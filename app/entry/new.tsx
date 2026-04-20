import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, router } from "expo-router";
import { ChevronLeft, Sparkles } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AlignmentGuide } from "@/components/camera/AlignmentGuide";
import { CameraControlSheet } from "@/components/camera/CameraControlSheet";
import { GhostOverlay } from "@/components/camera/GhostOverlay";
import {
  BodyMeasurementZoneIcon,
  NotesGlyphIcon,
} from "@/components/measurements/BodyMeasurementIcons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useEntries } from "@/contexts/EntriesContext";
import type { CircumferenceUnit, Entry, PhotoAngle, WeightUnit } from "@/types";
import { MEASUREMENT_GROUPS, MEASUREMENT_LABELS } from "@/utils/constants";
import {
  CIRCUMFERENCE_UNIT_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  defaultUnitForKey,
  isWeightMeasurementKey,
} from "@/utils/measurements";
import { safeGoBack } from "@/utils/navigation";
import { theme } from "@/utils/theme";

const PHOTO_ORDER: PhotoAngle[] = ["front", "side", "back"];

function newEntryId() {
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseOptionalMeasurement(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export default function NewEntryScreen() {
  const colorScheme = useColorScheme();
  const measurementOutline = colorScheme === "dark" ? "#94a3b8" : "#64748b";
  const insets = useSafeAreaInsets();
  const { addEntry, entries, getGhostUriForAngle } = useEntries();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<"photos" | "details">("photos");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [captured, setCaptured] = useState<Partial<Record<PhotoAngle, string>>>(
    {},
  );
  const [referenceEntryId, setReferenceEntryId] = useState<string | null>(null);
  const [ghostOpacity, setGhostOpacity] = useState(0.28);
  const [ghostEnabled, setGhostEnabled] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [capturing, setCapturing] = useState(false);

  const currentAngle = PHOTO_ORDER[photoIndex] ?? "front";
  const ghostUri = useMemo(
    () => getGhostUriForAngle(currentAngle, referenceEntryId),
    [currentAngle, getGhostUriForAngle, referenceEntryId],
  );

  const sortedReferences = useMemo(
    () =>
      [...entries].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      ),
    [entries],
  );

  const [measurementInputs, setMeasurementInputs] = useState<
    Record<string, string>
  >({});
  const [measurementUnits, setMeasurementUnits] = useState<
    Record<keyof Entry["measurements"], CircumferenceUnit | WeightUnit>
  >(() => {
    const init = {} as Record<
      keyof Entry["measurements"],
      CircumferenceUnit | WeightUnit
    >;
    for (const { key } of MEASUREMENT_LABELS) {
      init[key] = defaultUnitForKey(key);
    }
    return init;
  });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const capturedCount = useMemo(
    () => PHOTO_ORDER.reduce((n, a) => n + (captured[a] ? 1 : 0), 0),
    [captured],
  );

  const advancePhotoStep = useCallback(() => {
    if (photoIndex < PHOTO_ORDER.length - 1) {
      setPhotoIndex((i) => i + 1);
    } else {
      setPhase("details");
    }
  }, [photoIndex]);

  const onSkipCurrentAngle = useCallback(() => {
    if (photoIndex < PHOTO_ORDER.length - 1) {
      setPhotoIndex((i) => i + 1);
      return;
    }
    if (capturedCount === 0) {
      Alert.alert(
        "Photo required",
        "Capture at least one angle before continuing to measurements.",
      );
      return;
    }
    setPhase("details");
  }, [capturedCount, photoIndex]);

  const onCapture = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
      });
      if (!photo?.uri) {
        Alert.alert("Capture failed", "No image was returned from the camera.");
        return;
      }
      setCaptured((prev) => ({ ...prev, [currentAngle]: photo.uri }));
      if (photoIndex < PHOTO_ORDER.length - 1) {
        setPhotoIndex((i) => i + 1);
      } else {
        setPhase("details");
      }
    } catch (e) {
      Alert.alert(
        "Capture failed",
        e instanceof Error ? e.message : "Unknown error",
      );
    } finally {
      setCapturing(false);
    }
  }, [currentAngle, photoIndex]);

  const onSave = useCallback(async () => {
    if (capturedCount === 0) {
      Alert.alert("Photo required", "Add at least one photo before saving.");
      return;
    }
    const photos: Partial<Record<PhotoAngle, string>> = {};
    for (const a of PHOTO_ORDER) {
      const u = captured[a];
      if (u) photos[a] = u;
    }
    const measurements: Entry["measurements"] = {};
    for (const { key } of MEASUREMENT_LABELS) {
      const v = parseOptionalMeasurement(measurementInputs[key] ?? "");
      if (v == null) continue;
      const unit = measurementUnits[key] ?? defaultUnitForKey(key);
      if (key === "weight") {
        measurements.weight = { value: v, unit: unit as WeightUnit };
      } else {
        const circKey = key as Exclude<keyof Entry["measurements"], "weight">;
        measurements[circKey] = {
          value: v,
          unit: unit as CircumferenceUnit,
        };
      }
    }
    const id = newEntryId();
    const entry: Entry = {
      id,
      createdAt: new Date(),
      photos,
      measurements,
      notes: notes.trim() ? notes.trim() : undefined,
    };
    try {
      setSaving(true);
      await addEntry(entry);
      router.replace(`/entry/${id}`);
    } catch (e) {
      Alert.alert(
        "Could not save",
        e instanceof Error ? e.message : "Unknown error",
      );
    } finally {
      setSaving(false);
    }
  }, [
    addEntry,
    captured,
    capturedCount,
    measurementInputs,
    measurementUnits,
    notes,
  ]);

  const goBackFromDetails = useCallback(() => {
    setPhase("photos");
    const firstMissing = PHOTO_ORDER.findIndex((a) => !captured[a]);
    setPhotoIndex(firstMissing === -1 ? 0 : firstMissing);
  }, [captured]);

  const onRetakeCurrent = useCallback(() => {
    setCaptured((prev) => {
      const next = { ...prev };
      delete next[currentAngle];
      return next;
    });
  }, [currentAngle]);

  if (phase === "details") {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Measurements",
            headerLeft: () => (
              <Pressable
                accessibilityRole="button"
                onPress={goBackFromDetails}
                className="flex-row items-center py-2 pr-2"
              >
                <ChevronLeft size={22} color={theme.accent} />
                <Text className="font-inter-semibold text-base text-accent">
                  Photos
                </Text>
              </Pressable>
            ),
            headerRight: () => (
              <Pressable
                accessibilityRole="button"
                onPress={() => safeGoBack()}
                className="py-2 pl-2"
              >
                <Text className="font-inter-medium text-base text-slate-500 dark:text-vault-muted">
                  Cancel
                </Text>
              </Pressable>
            ),
          }}
        />
        <KeyboardAvoidingView
          className="flex-1 bg-slate-50 dark:bg-canvas"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <ScrollView
            className="flex-1 px-5 pt-2"
            contentContainerStyle={{
              paddingBottom: 120 + Math.max(insets.bottom, 16),
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Text className="mb-5 text-sm leading-6 text-slate-600 dark:text-vault-muted">
              Type a value, then pick cm or in (kg or lb for weight) on the
              right — or leave blank. Only filled rows are saved, in the units
              you chose.
            </Text>
            {MEASUREMENT_GROUPS.map((group) => (
              <Card key={group.title} className="mb-4">
                <Text className="mb-3 font-inter-semibold text-[11px] uppercase tracking-[0.14em] text-vault-muted">
                  {group.title}
                </Text>
                {group.keys.map((key) => {
                  const label =
                    MEASUREMENT_LABELS.find((m) => m.key === key)?.label ?? key;
                  const unitVal =
                    measurementUnits[key] ?? defaultUnitForKey(key);
                  return (
                    <View
                      key={key}
                      className="mb-3 min-h-[56px] flex-row items-center gap-2 border-b border-slate-100 pb-3 last:mb-0 last:border-b-0 last:pb-0 dark:border-white/10"
                    >
                      <View className="bg-accent/12 h-12 w-12 shrink-0 items-center justify-center rounded-2xl dark:bg-white/10">
                        <BodyMeasurementZoneIcon
                          zone={key}
                          size={48}
                          accentColor={theme.accent}
                          accessibilityLabel={`${label} — where to measure`}
                        />
                      </View>
                      <Text className="min-w-0 flex-1 font-inter-medium text-base text-slate-800 dark:text-vault-fg">
                        {label}
                      </Text>
                      <View className="shrink-0 flex-row items-center gap-1.5">
                        <TextInput
                          value={measurementInputs[key] ?? ""}
                          onChangeText={(t) =>
                            setMeasurementInputs((prev) => ({
                              ...prev,
                              [key]: t,
                            }))
                          }
                          keyboardType="decimal-pad"
                          placeholder="—"
                          placeholderTextColor="#94a3b8"
                          className="w-[76px] rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-right font-inter-semibold text-lg text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-white"
                          style={{
                            fontVariant: ["tabular-nums"],
                          }}
                        />
                        {isWeightMeasurementKey(key) ? (
                          <SegmentedControl
                            options={WEIGHT_UNIT_OPTIONS}
                            value={unitVal as WeightUnit}
                            onChange={(id) =>
                              setMeasurementUnits((prev) => ({
                                ...prev,
                                [key]: id,
                              }))
                            }
                            density="micro"
                            className="w-[74px] shrink-0"
                          />
                        ) : (
                          <SegmentedControl
                            options={CIRCUMFERENCE_UNIT_OPTIONS}
                            value={unitVal as CircumferenceUnit}
                            onChange={(id) =>
                              setMeasurementUnits((prev) => ({
                                ...prev,
                                [key]: id,
                              }))
                            }
                            density="micro"
                            className="w-[74px] shrink-0"
                          />
                        )}
                      </View>
                    </View>
                  );
                })}
              </Card>
            ))}
            <Card className="mb-4">
              <View className="mb-2 flex-row items-center gap-2.5">
                <View className="bg-accent/12 h-10 w-10 items-center justify-center rounded-2xl dark:bg-white/10">
                  <NotesGlyphIcon
                    size={22}
                    accentColor={theme.accent}
                    outlineColor={measurementOutline}
                    accessibilityLabel="Notes"
                  />
                </View>
                <Text className="font-inter-semibold text-lg text-slate-900 dark:text-vault-fg">
                  Notes (optional)
                </Text>
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholder="How you felt, training notes…"
                placeholderTextColor="#94a3b8"
                className="min-h-[100px] rounded-2xl border border-slate-200 bg-white p-3 font-inter-medium text-base text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-white"
                textAlignVertical="top"
              />
            </Card>
          </ScrollView>
          <View
            className="border-t border-slate-200 bg-white/95 px-5 pt-3 dark:border-white/10 dark:bg-surface/95"
            style={{
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            }}
          >
            <Button title="Save entry" onPress={onSave} loading={saving} />
          </View>
        </KeyboardAvoidingView>
      </>
    );
  }

  /* ——— Photo phase ——— */
  if (Platform.OS === "web") {
    return (
      <>
        <Stack.Screen options={{ title: "New entry" }} />
        <SafeAreaView
          className="flex-1 bg-slate-50 px-4 dark:bg-canvas"
          edges={["bottom"]}
        >
          <View className="flex-1 items-center justify-center">
            <Sparkles color={theme.accent} size={40} />
            <Text className="mt-4 text-center font-inter-semibold text-lg text-slate-900 dark:text-vault-fg">
              New entry on this device
            </Text>
            <Text className="mt-2 max-w-sm text-center text-slate-600 dark:text-vault-muted">
              New entries need the camera. Open BodyTrace in Expo Go on iOS or
              Android, or use a development build on a device.
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <>
        <Stack.Screen options={{ title: "New entry" }} />
        <SafeAreaView
          className="flex-1 bg-canvas px-4"
          edges={["top", "bottom"]}
        >
          <View className="flex-1 items-center justify-center">
            <Text className="mb-4 text-center text-base text-white">
              Camera access is needed to capture your front, side, and back
              photos.
            </Text>
            <Button title="Allow camera" onPress={() => requestPermission()} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Photo ${photoIndex + 1} of 3`,
          headerBackTitle: "Cancel",
        }}
      />
      <View className="flex-1 bg-black">
        <View className="absolute inset-0">
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            mode="picture"
            enableTorch={false}
          />
          <GhostOverlay
            imageUri={ghostUri}
            opacity={ghostEnabled ? ghostOpacity : 0}
          />
          <AlignmentGuide visible={showGuide} />
          <View className="absolute left-0 right-0 top-12 items-center px-4">
            <View className="rounded-full border border-white/10 bg-canvas/60 px-4 py-2">
              <Text className="text-center font-inter-semibold capitalize text-white">
                {currentAngle}
              </Text>
              <Text className="text-center text-xs text-white/85">
                Match the ghost, then capture
              </Text>
            </View>
          </View>
        </View>

        <View
          className="absolute bottom-0 left-0 right-0 z-10"
          pointerEvents="box-none"
        >
          <CameraControlSheet
            variant="entry"
            title="Capture"
            progressLabel={`${capturedCount}/${PHOTO_ORDER.length} captured`}
            angle={currentAngle}
            onAngleChange={(a) => setPhotoIndex(PHOTO_ORDER.indexOf(a))}
            referenceEntryId={referenceEntryId}
            onReferenceEntryId={setReferenceEntryId}
            referenceEntries={sortedReferences}
            ghostOpacity={ghostOpacity}
            onGhostOpacityChange={setGhostOpacity}
            ghostEnabled={ghostEnabled}
            onGhostEnabledChange={setGhostEnabled}
            showGuide={showGuide}
            onToggleGuide={() => setShowGuide((g) => !g)}
            photoOrder={PHOTO_ORDER}
            photoIndex={photoIndex}
            onPhotoIndexChange={setPhotoIndex}
            captured={captured}
            footer={
              <View className="mt-1">
                {captured[currentAngle] ? (
                  <View className="gap-2">
                    <Text className="text-center font-inter-medium text-xs text-accent/95">
                      Photo saved for this angle.
                    </Text>
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <Button
                          title="Retake"
                          variant="secondary"
                          onPress={onRetakeCurrent}
                        />
                      </View>
                      <View className="flex-1">
                        <Button
                          title={
                            photoIndex < PHOTO_ORDER.length - 1
                              ? "Next angle"
                              : "Measurements"
                          }
                          onPress={advancePhotoStep}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="gap-2">
                    <Button
                      title={
                        capturing ? "Capturing…" : `Capture ${currentAngle}`
                      }
                      loading={capturing}
                      onPress={onCapture}
                    />
                    <Button
                      title="Skip this angle"
                      variant="secondary"
                      onPress={onSkipCurrentAngle}
                    />
                  </View>
                )}
              </View>
            }
          />
        </View>
      </View>
    </>
  );
}
